# HEM Analyzer (MVP)

前后端最小可用方案：前端以 VS Code 风格 UI 上传 MP4、框选 ROI；后端基于 FastAPI + OpenCV 逐帧在服务器端解码、计算 ROI 灰度序列并给出 HEM 检测结果（突增、阈值、相对）。

## 目录结构

- `backend/` FastAPI 服务与检测逻辑
- `frontend/` 静态页面（无需打包，直接打开或用静态服务器）
- `resource/` 样例视频与文档

## 后端

### 安装依赖

```bash
pip install -r backend/requirements.txt
```

Windows 需要本地有可用的 OpenCV 视频解码能力（opencv-python-headless 走 FFmpeg 内置编解码）。若遇到特定编码无法解码，可改用系统 `ffmpeg` 做转码或安装完整版 `opencv-python`。

### 启动

```bash
python backend/main.py
# 或
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

接口：
- `GET /health` 健康检查
- `POST /analyze` multipart 表单：
  - `file`: MP4 文件
  - `roi_x, roi_y, roi_w, roi_h`：ROI 归一化坐标（相对宽高 0-1）
  - `sample_fps`：抽帧分析帧率（默认 8）
  - `methods`：`sudden,threshold,relative` 逗号分隔

返回：
```json
{
  "has_hem": true,
  "events": [{"t": 1.25, "type": "sudden", "score": 12.3}],
  "baseline": 42.0,
  "series": [{"t": 0.0, "roi": 40.1, "ref": 38.9}]
}
```

## 前端

直接打开 `frontend/index.html`（或用任意静态服务器，如 VS Code 的 Live Server）。

步骤：
1. 选择 MP4 视频
2. 在视频上拖拽选择 ROI
3. 设置采样帧率与勾选检测方案
4. 点击「分析」，等待结果与曲线

默认后端地址为 `http://localhost:8000`，若有变更，请在 `frontend/script.js` 中调整。

## 检测说明（简化实现）
- 突增（sudden）：平滑后序列一阶差分大于自适应门限（基于 MAD）且超过最小跃迁
- 阈值（threshold）：相对起始基线（前若干样本中位）超过固定阈值，可设最小持续帧数
- 相对（relative）：与同帧全局灰度均值的差值超过阈值（可扩展为同水平带或自定义参考区）

可调参数位置：`backend/main.py` 的 `detect_events` 函数（阈值、平滑窗口、基线窗口）。

## 可能的后续改进
- 支持 ROI 微跟踪（抖动补偿）
- 参考区域改为同帧同水平带/多带对比
- 更友好的事件标注/回放定位
- 边上传边流式分析（Chunked）

