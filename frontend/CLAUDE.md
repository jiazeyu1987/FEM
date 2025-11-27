# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HEM Analyzer is a web-based video analysis tool for detecting Hemodynamic Events (HEM) in MP4 videos. The application consists of:

- **Backend**: FastAPI service with OpenCV for video processing and HEM detection algorithms
- **Frontend**: Static HTML/CSS/JavaScript application with VS Code-style UI
- **Architecture**: Client-server model where frontend uploads videos to backend for analysis

## Development Commands

### Frontend Development

The frontend is a static site (no build process required):

```bash
# Start development server (serves frontend with no-cache headers)
python serve.py
# Or specify port
PORT=8080 python serve.py

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
python serve.py
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

### API Contract

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
  "series": [{"t": timestamp, "roi": number, "ref": number}]
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

### Configuration Parameters
All detection parameters are configurable via frontend UI:
- Smoothing window size, baseline sample count
- Thresholds for each detection method
- Timeline shading for result visualization

## Development Notes

- Frontend uses no build tools - direct file serving with cache-busting via query params
- Backend requires OpenCV video codec support on the host system
- Default ports: Backend (8421), Frontend (5173)
- Video files processed server-side, not in browser