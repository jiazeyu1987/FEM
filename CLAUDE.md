# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HEM Analyzer** is a medical diagnostic tool for detecting gas emboli (HEM) events during High-Intensity Focused Ultrasound (HIFU) treatment. This is a full-stack web application with a VS Code-themed UI for video upload and ROI selection, backed by FastAPI + OpenCV for video analysis.

## Architecture

- **Frontend**: Static HTML5/CSS3/JavaScript (no build tools, no frameworks)
- **Backend**: FastAPI with OpenCV for video processing
- **Communication**: RESTful API with CORS enabled
- **Deployment**: Docker-ready with static frontend

## Development Commands

### Backend Development
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Start backend server
python backend/main.py
# OR
uvicorn backend.main:app --host 0.0.0.0 --port 8421 --reload
```

### Frontend Development
```bash
# Option 1: Direct file access (no server needed)
# Simply open frontend/index.html in browser

# Option 2: Development server with no-cache
python frontend/serve.py
# OR use Windows PowerShell script
./start-frontend.ps1
```

### Docker
```bash
cd backend && docker build -t hem-analyzer .
docker run -p 8421:8421 hem-analyzer
```

## Key Technical Details

### Core Dependencies
- **Backend**: FastAPI 0.115.0, OpenCV 4.10.0.84, NumPy 2.1.1, Uvicorn 0.30.6
- **Frontend**: Pure JavaScript with Chart.js (embedded), no package.json
- **Video Processing**: MP4 files with frame sampling at configurable fps

### HEM Detection Methods
1. **Sudden Detection**: ROI gray scale first-order difference exceeds adaptive MAD-based threshold
2. **Threshold Detection**: ROI gray scale exceeds baseline + offset for minimum duration
3. **Relative Detection**: ROI gray scale difference from global mean exceeds threshold

### API Endpoints
- `GET /health` - Health check
- `POST /analyze` - Main analysis endpoint accepting:
  - `file`: MP4 video (multipart/form-data)
  - `roi_x, roi_y, roi_w, roi_h`: Normalized ROI coordinates (0-1)
  - `sample_fps`: Analysis sampling rate (default 8)
  - `methods`: Detection methods (`sudden,threshold,relative`)
  - Optional parameters: `smooth_k`, `baseline_n`, `sudden_k`, `sudden_min`, `threshold_delta`, `threshold_hold`, `relative_delta`

## Important Development Notes

- **No build process** - Frontend is truly static
- **Chinese UI** - Interface text is in Chinese
- **ROI coordinates** use normalized values (0-1 range)
- **Default ports**: Backend 8421, Frontend 5173 (configurable)
- **Windows development** - PowerShell script available for frontend
- **Video codecs** - May need FFmpeg or full opencv-python on Windows

## File Structure Context

- `backend/main.py` - Main FastAPI application and video processing logic
- `frontend/script.js` - Core frontend interaction logic (1345+ lines)
- `frontend/styles.css` - VS Code-themed styling
- `frontend/serve.py` - Development server with no-cache headers
- `frontend/index.html` - Main application interface

## Frontend Architecture Details

### Core Components
- **Video ROI Selection**: Interactive ROI with two modes:
  - Drag mode: Left-drag to select rectangle
  - Center-point mode: Click to set center with configurable dimensions
- **Real-time Visualization**: Three analysis curves with toggles:
  - Blue (Δv): Current frame ROI mean - historical mean
  - Yellow (d(Δv)): First-order derivative of blue curve
  - White: ROI average grayscale value
  - Pink: ROI standard deviation
  - Purple: High gray value ratio (>130)
- **Timeline Navigation**: Interactive timeline with zoom/pan and click-to-scrub
- **Information Panel**: Shows curve values at clicked timestamps
- **Batch Processing**: Multi-video analysis with progress tracking

### Key JavaScript Modules
- `renderChart()` - Main chart rendering with curve toggles and Y-axis zoom
- `renderTimeline()` - Timeline with event markers and shaded intervals
- `interpolateCurveValues()` - Linear interpolation for value display
- `processBatchQueue()` - Async batch analysis engine
- ROI interaction handlers for drag/center-point modes

### Chart System
- Custom Canvas-based rendering (no external libraries)
- Synchronized chart-timeline view
- Wheel zoom on Y-axis (when over chart area)
- Timeline shading based on rise/fall thresholds

## Backend Architecture Details

### Video Processing Pipeline
1. `sample_frames()` - Frame sampling at configurable FPS
2. `compute_series()` - ROI and reference mean calculation
3. `detect_events()` - Multi-method HEM detection with parameters
4. Response format: `has_hem`, `events`, `baseline`, `series`

### Detection Algorithm Parameters
- `smooth_k`: Moving average window size
- `baseline_n`: Number of samples for baseline calculation
- `sudden_k`: Sudden detection threshold multiplier
- `sudden_min`: Minimum jump threshold
- `threshold_delta`: Threshold detection offset
- `threshold_hold`: Minimum duration for threshold detection
- `relative_delta`: Relative detection threshold