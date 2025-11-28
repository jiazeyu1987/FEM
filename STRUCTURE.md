# 项目树形结构与说明

```
FEM/ - HEM Analyzer MVP 根目录
|-- .dockerignore - 定义构建镜像时可忽略的缓存、媒体与无需打包的目录
|-- .gitignore - 忽略 `.venv` 虚拟环境，避免提交本地依赖
|-- IFLOW.md - 中文项目概述，涵盖背景、架构和功能说明
|-- README.md - 使用说明，介绍依赖安装、启动方式与检测流程
|-- check_syntax.js - Node.js 辅助脚本，从旧路径读取 `frontend/script.js` 并打印特定行便于调试
|-- start-frontend.ps1 - PowerShell 脚本，查找 Python3 并运行 `frontend/serve.py` 启动禁用缓存的静态服务器
|-- backend/ - FastAPI + OpenCV 后端，承担视频抽帧、ROI 序列与 HEM 检测
|   |-- Dockerfile - 基于 `python:3.11-slim` 安装依赖并用 `uvicorn main:app` 启动
|   |-- main.py - FastAPI 入口，提供 `/health`、`/analyze`，完成抽帧、序列计算和三类事件检测
|   |-- requirements.txt - 后端依赖列表（FastAPI、Uvicorn、OpenCV、NumPy、python-multipart、Starlette）
|   \-- __pycache__/ - Python 字节码缓存目录
|       |-- main.cpython-311.pyc - Python 3.11 执行 `main.py` 生成的缓存
|       \-- main.cpython-313.pyc - Python 3.13 执行 `main.py` 生成的缓存
|-- frontend/ - VS Code 风格静态前端，负责视频上传、ROI 选择与结果可视化
|   |-- index.html - 页面骨架，含表单侧栏、视频面板、分析结果与事件表格
|   |-- script.js - 前端核心逻辑：ROI 拖拽/平移、参数管理、调用 `/analyze`、绘制曲线及时间线遮罩
|   |-- styles.css - VS Code 主题样式，定义布局、配色、面板与图表视觉
|   \-- serve.py - 简易 HTTP 服务，禁用缓存并自动打开浏览器
\-- resource/ - 示例素材
    |-- 2435470964636f15a0652837d25077fd.mp4 - 示例视频 1，用于离线演示检测效果
    |-- 98f85959061319f97d93debbc3300723.mp4 - 示例视频 2，提供不同场景供算法验证
    \-- ����.docx - 附带的 Word 文档（文件名含非 ASCII 字符，内容需本地查看）
```

> 备注：树中每个节点均附用途说明，方便快速了解仓库结构。
