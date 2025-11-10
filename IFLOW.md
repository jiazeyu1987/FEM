# HEM Analyzer 项目概述

## 项目简介

HEM Analyzer 是一个用于检测高强度聚焦超声（HIFU）治疗过程中气体栓塞（HEM）事件的分析工具。它采用前后端分离的架构，前端提供用户界面用于视频上传和ROI（感兴趣区域）选择，后端基于FastAPI和OpenCV进行视频解码和HEM事件分析。

## 技术栈

*   **后端**: Python, FastAPI, OpenCV, NumPy
*   **前端**: HTML, CSS, JavaScript (无打包需求，静态页面)
*   **通信**: RESTful API (FastAPI)

## 目录结构

```
HEM/
├── backend/          # 后端服务与检测逻辑
├── frontend/         # 静态页面
├── resource/         # 样例视频与文档
├── IFLOW.md          # 项目上下文信息（本文件）
├── README.md         # 项目说明与使用指南
├── start-frontend.ps1# 启动前端的PowerShell脚本
├── .dockerignore     # Docker忽略文件
├── .gitignore        # Git忽略文件
```

## 后端 (`backend/`)

### 核心文件

*   `main.py`: FastAPI应用入口，包含健康检查和分析接口。
*   `requirements.txt`: Python依赖列表。

### 功能模块

1.  **视频处理**:
    *   接收前端上传的MP4视频文件。
    *   使用OpenCV逐帧解码视频。
2.  **ROI分析**:
    *   根据前端提供的归一化坐标(`roi_x`, `roi_y`, `roi_w`, `roi_h`)提取ROI区域。
    *   计算ROI区域的平均灰度值。
3.  **灰度序列计算**:
    *   根据`sample_fps`参数对视频帧进行抽样。
    *   生成ROI区域灰度值的时间序列。
4.  **HEM事件检测**:
    *   实现三种检测方法：
        *   **突增 (sudden)**: 检测灰度值一阶差分的突变。
        *   **阈值 (threshold)**: 检测灰度值超过基线和固定阈值之和。
        *   **相对 (relative)**: 棜测ROI灰度值与同帧全局灰度均值的差值。
    *   汇总检测结果，判断是否发生HEM事件。

### 启动与接口

*   **启动命令**:
    ```bash
    python backend/main.py
    # 或
    uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
    ```
*   **API接口**:
    *   `GET /health`: 健康检查。
    *   `POST /analyze`: 接收视频和参数，返回分析结果。

## 前端 (`frontend/`)

### 核心文件

*   `index.html`: 主页面结构。
*   `styles.css`: 页面样式。
*   `script.js`: 页面交互逻辑。

### 功能模块

1.  **视频上传与预览**:
    *   用户选择MP4文件进行上传。
    *   在页面中预览视频。
2.  **ROI选择**:
    *   用户在视频上通过鼠标拖拽选择ROI区域。
3.  **参数设置**:
    *   设置采样帧率。
    *   选择启用的检测方案（突增、阈值、相对）。
    *   调整各种检测算法的参数。
4.  **结果展示**:
    *   显示HEM事件检测结果（是否有事件、事件数量）。
    *   以图表形式展示灰度序列和差分序列。
    *   以表格形式列出检测到的事件详情。

## 构建与运行

### 后端

1.  安装依赖:
    ```bash
    pip install -r backend/requirements.txt
    ```
2.  启动服务:
    ```bash
    python backend/main.py
    ```

### 前端

1.  直接在浏览器中打开 `frontend/index.html`。
2.  或使用静态服务器（如VS Code的Live Server插件）打开。

## 开发约定

*   **后端**: 遵循FastAPI的开发规范。
*   **前端**: 使用原生JavaScript，无框架依赖。
*   **API**: 前后端通过RESTful API进行通信，默认地址为 `http://localhost:8000`。