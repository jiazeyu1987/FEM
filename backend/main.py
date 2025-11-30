from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tempfile
import shutil
import cv2
import numpy as np
from typing import List, Optional, Dict, Any

app = FastAPI(title="HEM Analyzer", version="0.1.0")

# Allow local static frontend and simple dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"]
    ,allow_headers=["*"]
)


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


def sample_frames(cap: cv2.VideoCapture, sample_fps: float):
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    if fps <= 0:
        fps = 25.0
    stride = max(int(round(fps / max(sample_fps, 0.1))), 1)
    idx = 0
    frame_index = 0
    success, frame = cap.read()
    while success:
        if idx % stride == 0:
            t = frame_index / max(fps, 0.0001)
            yield frame, t
        idx += 1
        frame_index += 1
        success, frame = cap.read()


def compute_series(
    cap: cv2.VideoCapture,
    roi: Dict[str, float],
    sample_fps: float,
    ref_mode: str = "global",
    high_threshold: int = 130,
    conditional_threshold1: int = 120,
    conditional_threshold2: int = 160,
):
    series_t: List[float] = []
    roi_mean: List[float] = []
    ref_mean: List[float] = []
    roi_std: List[float] = []
    roi_high_ratio: List[float] = []
    roi_conditional_ratio: List[float] = []

    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    x = max(min(roi.get("x", 0.0), 1.0), 0.0)
    y = max(min(roi.get("y", 0.0), 1.0), 0.0)
    rw = max(min(roi.get("w", 1.0), 1.0 - x), 0.0)
    rh = max(min(roi.get("h", 1.0), 1.0 - y), 0.0)

    for frame, t in sample_frames(cap, sample_fps):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        # integer ROI bounds
        x0 = int(x * w)
        y0 = int(y * h)
        x1 = int((x + rw) * w)
        y1 = int((y + rh) * h)
        x1 = min(max(x1, x0 + 1), w)
        y1 = min(max(y1, y0 + 1), h)

        roi_patch = gray[y0:y1, x0:x1]
        roi_val = float(np.mean(roi_patch)) if roi_patch.size else float("nan")
        roi_std_val = float(np.std(roi_patch)) if roi_patch.size else float("nan")
        # Calculate high gray value ratio (percentage of pixels > threshold)
        if roi_patch.size > 0:
            roi_high_ratio_val = float(np.sum(roi_patch > high_threshold) / roi_patch.size * 100)
        else:
            roi_high_ratio_val = float("nan")

        # Calculate conditional high gray value ratio
        # When average pixel value > threshold1, calculate percentage of pixels > threshold2
        if roi_patch.size > 0 and roi_val > conditional_threshold1:
            pixels_above_threshold2 = np.sum(roi_patch > conditional_threshold2)
            roi_conditional_ratio_val = float(pixels_above_threshold2 / roi_patch.size * 100)
            # Debug: Log orange curve calculation (only for first few points to avoid spam)
            if len(series_t) < 5:
                print(f"🟠 Orange curve calculation (frame {len(series_t)}):")
                print(f"  - ROI avg value: {roi_val:.2f} > threshold1: {conditional_threshold1}")
                print(f"  - Pixels > threshold2: {pixels_above_threshold2} / {roi_patch.size} = {roi_conditional_ratio_val:.2f}%")
        else:
            roi_conditional_ratio_val = 0.0
            # Debug: Log skipped calculation (only for first few points)
            if len(series_t) < 5:
                print(f"🟠 Orange curve skipped (frame {len(series_t)}):")
                print(f"  - ROI avg value: {roi_val:.2f} <= threshold1: {conditional_threshold1}")

        if ref_mode == "global":
            ref_val = float(np.mean(gray))
        else:
            # fallback to global if unknown mode
            ref_val = float(np.mean(gray))

        series_t.append(t)
        roi_mean.append(roi_val)
        ref_mean.append(ref_val)
        roi_std.append(roi_std_val)
        roi_high_ratio.append(roi_high_ratio_val)
        roi_conditional_ratio.append(roi_conditional_ratio_val)

    return series_t, roi_mean, ref_mean, roi_std, roi_high_ratio, roi_conditional_ratio


def moving_average(x: np.ndarray, k: int = 3) -> np.ndarray:
    if k <= 1 or x.size == 0:
        return x
    k = min(k, x.size)
    c = np.convolve(x, np.ones(k) / k, mode="same")
    return c


def mad(arr: np.ndarray) -> float:
    if arr.size == 0:
        return 0.0
    med = np.median(arr)
    return float(np.median(np.abs(arr - med)))


def detect_events(
    t: List[float],
    roi_mean: List[float],
    ref_mean: List[float],
    methods: List[str],
    params: Optional[Dict[str, Any]] = None,
):
    params = params or {}
    events = []
    arr = np.array(roi_mean, dtype=float)
    ref = np.array(ref_mean, dtype=float)
    tt = np.array(t, dtype=float)

    # Basic smoothing
    smooth_k = int(params.get("smooth_k", 3))
    arr_s = moving_average(arr, smooth_k)

    # Baseline from first seconds or first N samples
    n_baseline = int(params.get("baseline_n", max(5, min(20, int(0.2 * len(arr_s)) or 5))))
    base = float(np.median(arr_s[:n_baseline])) if n_baseline > 0 else float(np.median(arr_s))

    if "sudden" in methods:
        diff = np.diff(arr_s, prepend=arr_s[0])
        thr = params.get("sudden_k", 6.0) * max(mad(diff), 1e-3)
        min_jump = float(params.get("sudden_min", 4.0))
        for i, d in enumerate(diff):
            if d > max(thr, min_jump):
                events.append({"t": float(tt[i]), "type": "sudden", "score": float(d)})

    if "threshold" in methods:
        delta = float(params.get("threshold_delta", 8.0))
        hold = int(params.get("threshold_hold", 1))
        hold = max(1, hold)
        cnt = 0
        for i, v in enumerate(arr_s):
            if v > base + delta:
                cnt += 1
            else:
                cnt = 0
            if cnt == hold:
                events.append({"t": float(tt[i]), "type": "threshold", "score": float(v - (base + delta))})

    if "relative" in methods:
        rel = arr_s - ref
        # Normalize by ref to be robust to global illumination
        # Or just use difference
        delta_rel = float(params.get("relative_delta", 6.0))
        for i, d in enumerate(rel):
            if d > delta_rel:
                events.append({"t": float(tt[i]), "type": "relative", "score": float(d)})

    # Aggregate decision
    has_hem = len(events) > 0
    return events, has_hem, base


@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    roi_x: float = Form(...),
    roi_y: float = Form(...),
    roi_w: float = Form(...),
    roi_h: float = Form(...),
    sample_fps: float = Form(8.0),
    methods: str = Form("sudden,threshold,relative"),
    # Optional tuning parameters
    smooth_k: Optional[int] = Form(None),
    baseline_n: Optional[int] = Form(None),
    sudden_k: Optional[float] = Form(None),
    sudden_min: Optional[float] = Form(None),
    threshold_delta: Optional[float] = Form(None),
    threshold_hold: Optional[int] = Form(None),
    relative_delta: Optional[float] = Form(None),
    high_threshold: Optional[int] = Form(130),
    conditional_threshold1: Optional[int] = Form(120),
    conditional_threshold2: Optional[int] = Form(160),
):
    try:
        # Debug logging for received parameters
        print(f"📊 Analysis request received:")
        print(f"  - ROI: x={roi_x}, y={roi_y}, w={roi_w}, h={roi_h}")
        print(f"  - Sample FPS: {sample_fps}")
        print(f"  - Methods: {methods}")
        print(f"  - High threshold: {high_threshold}")
        print(f"  - Conditional threshold1: {conditional_threshold1}")
        print(f"  - Conditional threshold2: {conditional_threshold2}")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            with tempfile.TemporaryFile() as sink:
                # stream to temp file
                while True:
                    chunk = await file.read(1024 * 1024)
                    if not chunk:
                        break
                    tmp.write(chunk)
            temp_path = tmp.name

        cap = cv2.VideoCapture(temp_path)
        if not cap.isOpened():
            return JSONResponse(status_code=400, content={"error": "Cannot open video"})

        roi = {"x": roi_x, "y": roi_y, "w": roi_w, "h": roi_h}
        t, roi_m, ref_m, roi_s, roi_h, roi_c = compute_series(
            cap, roi, sample_fps, ref_mode="global",
            high_threshold=high_threshold or 130,
            conditional_threshold1=conditional_threshold1 or 120,
            conditional_threshold2=conditional_threshold2 or 160
        )
        cap.release()

        params: Dict[str, Any] = {}
        if smooth_k is not None: params["smooth_k"] = smooth_k
        if baseline_n is not None: params["baseline_n"] = baseline_n
        if sudden_k is not None: params["sudden_k"] = sudden_k
        if sudden_min is not None: params["sudden_min"] = sudden_min
        if threshold_delta is not None: params["threshold_delta"] = threshold_delta
        if threshold_hold is not None: params["threshold_hold"] = threshold_hold
        if relative_delta is not None: params["relative_delta"] = relative_delta

        evts, has_hem, base = detect_events(
            t,
            roi_m,
            ref_m,
            [m.strip() for m in methods.split(",") if m.strip()],
            params,
        )

        # Prepare compact series for plotting
        series = [{"t": float(tt), "roi": float(rm), "ref": float(rf), "std": float(rs), "high": float(rh), "orange": float(rc)} for tt, rm, rf, rs, rh, rc in zip(t, roi_m, ref_m, roi_s, roi_h, roi_c)]

        return {
            "has_hem": has_hem,
            "events": evts,
            "baseline": float(base),
            "series": series,
        }
    finally:
        # Best-effort cleanup of tempfile on Windows may need delayed delete; skipping explicit remove
        pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8421)
