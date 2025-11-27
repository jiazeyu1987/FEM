# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HEM Analyzer is a comprehensive multi-platform analysis tool for detecting Hemodynamic Events (HEM) in medical imaging data. The system provides multiple interfaces for different use cases:

- **Video Analysis**: FastAPI + OpenCV backend with VS Code-style web frontend for MP4 video processing
- **Data Analysis**: Python-based tools (GUI and web) for Excel result analysis and visualization
- **Desktop Applications**: Tkinter-based GUIs for offline analysis workflows
- **Architecture**: Multi-platform system supporting both real-time video analysis and post-processing workflows

## Development Commands

### Frontend Development

The frontend is a static site (no build process required):

```bash
# Start development server (serves frontend with no-cache headers)
python frontend/serve.py
# Or specify port
PORT=8080 python frontend/serve.py

# Alternative: PowerShell script
./start-frontend.ps1
./start-frontend.ps1 -Port 8080

# Direct file access (works but may have caching issues)
# Open frontend/index.html directly in browser
```

### Backend Development

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Start backend server
python backend/main.py
# Or using uvicorn directly
uvicorn backend.main:app --host 0.0.0.0 --port 8421 --reload

# Check health
curl http://localhost:8421/health
```

### Full Stack Development

```bash
# Terminal 1: Start backend
cd backend && python main.py

# Terminal 2: Start frontend
python frontend/serve.py
```

### Data Analysis Tools

**Python Web Server for Excel Analysis:**
```bash
cd frontend-python && python hem_server.py
# Access: http://localhost:3006
```

**Desktop GUI Applications:**
```bash
# Interactive GUI with file upload and analysis
cd frontend-python && python start_hem_gui.py

# Direct launch to specific GUI versions
cd frontend-python && python hem_analyzer_simple.py  # Simplified GUI
cd frontend-python && python hem_analyzer.py         # Advanced GUI
```

**Standalone Analysis Tools:**
```bash
# Open static HTML viewer (no server required)
open frontend/hem_analysis_static.html

# Excel file debugging and structure analysis
cd frontend-python && python debug_excel.py path/to/data.xlsx
```

## Code Architecture

### Backend (FastAPI + OpenCV)

- **Main file**: `backend/main.py` - FastAPI application and video processing logic
- **Entry point**: `main.py` defines FastAPI app with `/analyze` and `/health` endpoints
- **Video processing**: Uses OpenCV to decode MP4, extract ROI grayscale values
- **HEM Detection**: Three algorithms implemented in `detect_events()` function:
  - *Sudden*: First-order difference exceeds adaptive threshold (MAD-based)
  - *Threshold*: Value exceeds baseline + offset for minimum duration
  - *Relative*: Difference from frame-wise global mean exceeds threshold

### Frontend (Vanilla JavaScript)

- **Entry point**: `frontend/index.html` - Single-page application
- **Core logic**: `frontend/script.js` - All application logic (no frameworks)
- **Key modules** within script.js:
  - ROI selection with drag/pan controls
  - Video analysis via backend API
  - Real-time chart rendering using Canvas API
  - Timeline with zoom/pan/scrub interactions
  - Event detection visualization

### Frontend Component Structure

- **UI Layout**: VS Code-inspired dark theme with titlebar, sidebar, and main content area
- **Sidebar**: Video upload, ROI parameters, detection methods, analysis controls
- **Main Area**: Video panel with overlay, analysis results, dual-curve charts, timeline
- **Events Panel**: Tabulated detection results with timestamps and scores

### Data Analysis Tools Architecture

**Python Web Server (`frontend-python/hem_server.py`):**
- Built-in HTTP server on port 3006 with CORS support
- Matplotlib chart generation with base64 encoding for web delivery
- Mock data generation for testing (thresholds 60-200)
- JSON API endpoints for Excel data loading and chart requests

**Desktop GUI Applications:**
- **Tkinter + Matplotlib** framework for cross-platform compatibility
- **File support**: Excel files with pandas/openpyxl parsing
- **Interactive features**: Threshold selection, real-time chart updates, mouse hover annotations
- **Export capabilities**: CSV/Markdown format, statistical analysis summaries
- **Data visualization**: Scatter plots with HEM/non-HEM color coding

**Standalone HTML Tools:**
- **Chart.js integration** for client-side visualization
- **Mock data fallbacks** for offline testing
- **Threshold-based filtering** and real-time statistics
- **API integration** with optional server endpoints

### API Contracts

**Video Analysis API (Backend):**
```javascript
// POST /analyze
multipart/form-data:
- file: MP4 video
- roi_x, roi_y, roi_w, roi_h: normalized ROI coordinates (0-1)
- sample_fps: analysis framerate (default 8)
- methods: "sudden,threshold,relative"

// Response format
{
  "has_hem": boolean,
  "events": [{"t": timestamp, "type": "sudden|threshold|relative", "score": number}],
  "baseline": number,
  "series": [{"t": timestamp, "roi": number, "ref": number, "high_ratio": number}],
  "frames_10_to_20": {
    "average": number,
    "frame_count": number,
    "frames": [{"frame_num": number, "roi_value": number}]
  }
}
```

**Data Analysis API (Python Web Server):**
```javascript
// GET /api/excel-data
// Returns parsed Excel data with threshold and result columns
{
  "thresholds": [60, 61, 62, ...],
  "results": [0, 1, 0, 1, ...],
  "blueMax": [...],
  "yellowAvg": [...],
  // Additional data columns...
}

// GET /api/chart?threshold=120&yAxis=yellowAvg
// Returns base64-encoded matplotlib chart image
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "stats": {
    "sensitivity": 0.85,
    "specificity": 0.92,
    // Additional statistics...
  }
}
```

## Key Implementation Details

### Frontend State Management
- Global state variables in script.js (no state management library)
- Canvas-based rendering for performance with large video datasets
- ROI coordinates stored as normalized values (0-1) for resolution independence

### Backend Video Processing
- Frame sampling based on requested FPS
- OpenCV grayscale conversion and ROI extraction
- Baseline calculation using median of initial frames
- Event detection with configurable thresholds and parameters

## Multi-Tool Usage Guide

### When to Use Each Tool

| Tool | Best For | Environment | Key Features |
|------|----------|-------------|--------------|
| **Main Frontend** (`frontend/`) | Real-time video analysis, ROI selection | Browser + Backend | Interactive video processing, timeline controls |
| **Python Web Server** (`frontend-python/hem_server.py`) | Excel data analysis, collaborative work | Python environment | Web interface, Chart.js visualization, API access |
| **Desktop GUI** (`frontend-python/hem_analyzer*.py`) | Offline analysis, data exploration | Desktop with Python/Tkinter | Interactive charts, file exports, statistical analysis |
| **Static HTML** (`hem_analysis_static.html`) | Quick demos, testing, no-install scenarios | Browser only | Built-in mock data, no dependencies |

### Development Workflow Examples

**Video Analysis Workflow:**
```bash
# 1. Start video processing backend
cd backend && python main.py

# 2. Start web frontend for video analysis
cd frontend && python serve.py

# 3. Access http://localhost:5173 for video upload and analysis
```

**Data Analysis Workflow:**
```bash
# Option A: Web-based analysis
cd frontend-python && python hem_server.py
# Access http://localhost:3006

# Option B: Desktop GUI analysis
cd frontend-python && python start_hem_gui.py

# Option C: Quick static viewing
open frontend/hem_analysis_static.html
```

**Full Analysis Pipeline:**
```bash
# Terminal 1: Video processing
cd backend && python main.py

# Terminal 2: Video analysis interface
cd frontend && python serve.py

# Terminal 3: Data analysis for Excel results
cd frontend-python && python hem_server.py
```

### Excel Data Processing
- **Expected columns**: 高亮度像素阈值, ROI宽度_px, ROI高度_px, 蓝色最大值/平均值, 黄色最大值/平均值, 结果值
- **Data types**: Numerical thresholds, pixel dimensions, color channel values, binary HEM results
- **File support**: .xlsx files with automatic column detection
- **Fallback**: Mock data generation for testing without files

### Configuration Parameters
All detection parameters are configurable via frontend UI:
- Smoothing window size, baseline sample count
- Thresholds for each detection method
- Timeline shading for result visualization
- **Data analysis**: Threshold selection, Y-axis data choice (yellow max/avg), chart styling

### Analysis Results Display
The frontend displays comprehensive analysis results including:
- **Standard statistics**: Baseline, ROI mean/max, max jump, max diff, duration
- **Dual curve visualization**: Blue delta values and yellow brightness percentages
- **HEM event detection**: Events table with timestamps and detection scores
- **Frames 10-20 average**: Detailed analysis of early video frames with hover tooltips showing individual frame values

## Development Notes

### Port Allocation
- **Backend**: 8421 (FastAPI video processing)
- **Frontend**: 5173 (static server) or custom via PORT env
- **Data Analysis Server**: 3006 (Python web server)
- **Fallback**: 8081 (static HTML backup)

### Dependencies and Requirements
- **Video processing**: Requires OpenCV video codec support on host system
- **Data analysis tools**: pandas, matplotlib, openpyxl, tkinter
- **Frontend**: No build process - direct file serving with cache-busting
- **Browser compatibility**: Modern browsers with Canvas API support

### Architecture Decisions
- **Multi-platform approach**: Separate tools for video vs data analysis workflows
- **Offline capability**: Standalone HTML tools for environments without Python
- **Cross-platform compatibility**: Tkinter for desktop GUIs, web interfaces for broader access
- **Performance**: Canvas-based rendering for large datasets, server-side video processing

### Testing and Development
- Video files processed server-side, not in browser (security and performance)
- Mock data generation available for all tools (thresholds 60-200 range)
- Interactive features include mouse hover annotations, real-time threshold updates
- Export capabilities: CSV/Markdown for analysis results, base64 PNG for charts
- Comprehensive error handling with user-friendly messages for missing dependencies

### File Structure Summary
```
D:\ProjectPackage\FEM\
├── backend/                 # FastAPI video processing
├── frontend/               # Main VS Code-style web interface
├── frontend-react/         # Alternative React frontend
├── frontend-python/        # Python data analysis tools
│   ├── hem_server.py       # Web server for Excel analysis
│   ├── hem_analyzer*.py    # Desktop GUI applications
│   └── debug_excel.py      # Excel file debugging utility
├── hem_analysis*.html      # Standalone analysis tools
└── start-frontend.ps1      # PowerShell launcher script
```