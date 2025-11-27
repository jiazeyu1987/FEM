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
    brightness_threshold: float = 128.0,
):
    series_t: List[float] = []
    roi_mean: List[float] = []
    ref_mean: List[float] = []
    high_brightness_ratio: List[float] = []

    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # HEM系统标准坐标验证和边界检查
    raw_x = roi.get("x", 0.0)
    raw_y = roi.get("y", 0.0)
    raw_w = roi.get("w", 1.0)
    raw_h = roi.get("h", 1.0)

    print(f"HEM后端分析 - 原始接收坐标: x={raw_x:.4f}, y={raw_y:.4f}, w={raw_w:.4f}, h={raw_h:.4f}")
    print(f"HEM后端分析 - 视频尺寸: {w}x{h}")

    # HEM系统严格的归一化坐标验证
    x = max(min(raw_x, 1.0), 0.0)
    y = max(min(raw_y, 1.0), 0.0)
    rw = max(min(raw_w, 1.0 - x), 0.0)
    rh = max(min(raw_h, 1.0 - y), 0.0)

    # 验证坐标是否被调整
    x_adjusted = abs(x - raw_x) > 1e-6
    y_adjusted = abs(y - raw_y) > 1e-6
    w_adjusted = abs(rw - raw_w) > 1e-6
    h_adjusted = abs(rh - raw_h) > 1e-6

    if x_adjusted or y_adjusted or w_adjusted or h_adjusted:
        print(f"HEM坐标调整: x({x_adjusted}), y({y_adjusted}), w({w_adjusted}), h({h_adjusted})")
        print(f"HEM调整后坐标: x={x:.4f}, y={y:.4f}, w={rw:.4f}, h={rh:.4f}")

    # HEM系统计算像素坐标
    x0 = int(x * w)
    y0 = int(y * h)
    x1 = int((x + rw) * w)
    y1 = int((y + rh) * h)

    # HEM系统最小ROI尺寸验证
    min_roi_size = 1
    x1 = min(max(x1, x0 + min_roi_size), w)
    y1 = min(max(y1, y0 + min_roi_size), h)

    # 最终ROI尺寸
    final_roi_w = x1 - x0
    final_roi_h = y1 - y0

    print(f"HEM后端分析 - 像素ROI坐标: ({x0}, {y0}) to ({x1}, {y1})")
    print(f"HEM后端分析 - 最终ROI尺寸: {final_roi_w}x{final_roi_h} 像素")

    # 验证ROI的有效性
    if final_roi_w <= 0 or final_roi_h <= 0:
        print(f"HEM错误: 无效的ROI尺寸 {final_roi_w}x{final_roi_h}")
        return series_t, roi_mean, ref_mean, high_brightness_ratio

    # 验证ROI是否完全在视频边界内
    if x0 < 0 or y0 < 0 or x1 > w or y1 > h:
        print(f"HEM错误: ROI超出视频边界 ({x0},{y0}) to ({x1},{y1}) in {w}x{h}")
        return series_t, roi_mean, ref_mean, high_brightness_ratio

    print(f"HEM验证通过: ROI坐标和尺寸有效")

    frame_count = 0
    for frame, t in sample_frames(cap, sample_fps):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # 使用HEM验证过的坐标提取ROI
        roi_patch = gray[y0:y1, x0:x1]
        roi_val = float(np.mean(roi_patch)) if roi_patch.size else float("nan")

        # 打印前几帧的调试信息
        if frame_count < 3:
            print(f"第{frame_count+1}帧: ROI区域灰度均值={roi_val:.2f}, ROI区域尺寸={roi_patch.shape}, 全局灰度均值={np.mean(gray):.2f}")
            if frame_count == 0:
                print(f"ROI区域像素值范围: {np.min(roi_patch):.2f} - {np.max(roi_patch):.2f}")

        frame_count += 1

        # Calculate high brightness pixel ratio
        if roi_patch.size > 0:
            high_pixels = np.sum(roi_patch >= brightness_threshold)
            high_ratio = (high_pixels / roi_patch.size) * 100.0  # Convert to percentage
        else:
            high_ratio = 0.0

        if ref_mode == "global":
            ref_val = float(np.mean(gray))
        else:
            # fallback to global if unknown mode
            ref_val = float(np.mean(gray))

        series_t.append(t)
        roi_mean.append(roi_val)
        ref_mean.append(ref_val)
        high_brightness_ratio.append(high_ratio)

    return series_t, roi_mean, ref_mean, high_brightness_ratio


def compute_frames_10_to_20_average(
    cap: cv2.VideoCapture,
    roi: Dict[str, float],
):
    """
    计算第10~20帧的ROI平均灰度值
    """
    try:
        # 获取视频总帧数
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"视频总帧数: {total_frames}")

        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        x = max(min(roi.get("x", 0.0), 1.0), 0.0)
        y = max(min(roi.get("y", 0.0), 1.0), 0.0)
        rw = max(min(roi.get("w", 1.0), 1.0 - x), 0.0)
        rh = max(min(roi.get("h", 1.0), 1.0 - y), 0.0)

        # ROI coordinates
        x0 = int(x * w)
        y0 = int(y * h)
        x1 = int((x + rw) * w)
        y1 = int((y + rh) * h)
        x1 = min(max(x1, x0 + 1), w)
        y1 = min(max(y1, y0 + 1), h)

        print(f"ROI坐标: ({x0}, {y0}) to ({x1}, {y1})")

        # 重置视频到开始
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

        frames_10_to_20_values = []
        frame_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                print(f"无法读取第 {frame_count} 帧")
                break

            # 如果视频帧数不足20帧，调整处理范围
            max_frame = min(20, total_frames)

            # 处理第10帧到第min(20, total_frames)帧
            if 9 <= frame_count < max_frame:  # 第10帧是索引9
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                roi_patch = gray[y0:y1, x0:x1]

                if roi_patch.size > 0:
                    roi_val = float(np.mean(roi_patch))
                    frames_10_to_20_values.append(roi_val)
                    print(f"Frame {frame_count + 1}: ROI值 = {roi_val:.2f}")
                else:
                    roi_val = 0.0
                    frames_10_to_20_values.append(roi_val)
                    print(f"Frame {frame_count + 1}: ROI区域为空，使用0.0")

            frame_count += 1

            # 超过第20帧或视频结尾就停止
            if frame_count >= 20:
                break

        print(f"成功处理 {len(frames_10_to_20_values)} 帧")

        # 计算平均值
        if frames_10_to_20_values:
            average_10_to_20 = float(np.mean(frames_10_to_20_values))
            frame_details = [
                {
                    "frame_num": i + 10,
                    "roi_value": float(val)
                }
                for i, val in enumerate(frames_10_to_20_values)
            ]
            print(f"第10~20帧平均值: {average_10_to_20:.2f}")
        else:
            average_10_to_20 = 0.0
            frame_details = []
            print("没有处理到任何帧")

        return {
            "average": average_10_to_20,
            "frame_count": len(frames_10_to_20_values),
            "frames": frame_details
        }

    except Exception as e:
        print(f"计算第10~20帧平均值时出错: {e}")
        import traceback
        traceback.print_exc()
        return {
            "average": 0.0,
            "frame_count": 0,
            "frames": []
        }


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
    # Brightness threshold for high brightness pixel ratio
    brightness_threshold: float = Form(128.0),
):
    try:
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
        t, roi_m, ref_m, high_ratio = compute_series(cap, roi, sample_fps, ref_mode="global", brightness_threshold=brightness_threshold)

        # 在释放视频捕获之前计算第10~20帧的平均灰度值
        print("开始计算第10~20帧平均值...")
        frames_10_to_20_data = compute_frames_10_to_20_average(cap, roi)
        print("第10~20帧平均值计算完成")

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
        series = [{"t": float(tt), "roi": float(rm), "ref": float(rf), "high_ratio": float(hr)} for tt, rm, rf, hr in zip(t, roi_m, ref_m, high_ratio)]

        # 调试信息
        print(f"返回数据包含 frames_10_to_20: {frames_10_to_20_data}")
        print(f"frames_10_to_20 数据结构:")
        print(f"  - average: {frames_10_to_20_data.get('average', 'N/A')}")
        print(f"  - frame_count: {frames_10_to_20_data.get('frame_count', 'N/A')}")
        print(f"  - frames length: {len(frames_10_to_20_data.get('frames', []))}")

        return {
            "has_hem": has_hem,
            "events": evts,
            "baseline": float(base),
            "series": series,
            "frames_10_to_20": frames_10_to_20_data,
        }
    finally:
        # Best-effort cleanup of tempfile on Windows may need delayed delete; skipping explicit remove
        pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8421)
