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

# Option 3: Root-level development server
python serve.py
```

#### JavaScript Syntax Validation
```bash
# Validate JavaScript syntax (uses Node.js)
node check_syntax.js
```

### Docker
```bash
cd backend && docker build -t hem-analyzer .
docker run -p 8421:8421 hem-analyzer
```

## Key Technical Details

### Core Dependencies
- **Backend**: FastAPI 0.115.0, OpenCV 4.10.0.84 (headless), NumPy 2.1.1, Uvicorn 0.30.6, python-multipart 0.0.9, Starlette 0.38.4
- **Frontend**: Pure JavaScript with custom canvas-based rendering (no external chart libraries), no package.json
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

#### Response Format
```json
{
  "has_hem": true,
  "events": [
    {"t": 1.25, "type": "sudden", "score": 12.3},
    {"t": 2.15, "type": "threshold", "score": 8.7}
  ],
  "baseline": 42.0,
  "series": [
    {"t": 0.0, "roi": 40.1, "ref": 38.9},
    {"t": 0.125, "roi": 41.2, "ref": 39.1}
  ]
}
```

### Data Flow Architecture
1. **Frontend**: Video upload → ROI selection → Parameter configuration → API request
2. **Backend**: Video decoding → Frame sampling → ROI analysis → HEM detection → JSON response
3. **Visualization**: Six curves rendered on canvas with interactive timeline and event markers

## Important Development Notes

- **No build process** - Frontend is truly static
- **Chinese UI** - Interface text is in Chinese
- **ROI coordinates** use normalized values (0-1 range)
- **Default ports**: Backend 8421, Frontend 5173 (configurable)
- **Windows development** - PowerShell script available for frontend
- **Video codecs** - May need FFmpeg or full opencv-python on Windows
- **Additional interfaces**: Test pages available for batch analysis and curve viewing

## Development Patterns and Troubleshooting

### Common Development Tasks

#### Video Codec Issues on Windows
If OpenCV cannot decode MP4 files on Windows:
```bash
# Install full OpenCV with system codecs
pip uninstall opencv-python-headless
pip install opencv-python

# Or install FFmpeg and ensure it's in PATH
```

#### Backend URL Configuration
The frontend API endpoint is configured in `frontend/script.js`. Update the `backendUrl` constant if running backend on different host/port.

#### ROI Coordinate System
- ROI coordinates are normalized (0-1 range) relative to video dimensions
- Drag mode: Click and drag to select rectangle
- Center-point mode: Click to set center with configurable dimensions via `roiDimensions`

### Performance Considerations
- **Frame Sampling**: Default 8 FPS balances accuracy and performance
- **Large Videos**: Consider reducing `sample_fps` for faster processing
- **Memory Usage**: Backend processes videos in streaming fashion, not loading entire video into memory

### Testing and Validation
- Use test interfaces in `frontend/test-*.html` for algorithm validation
- `frontend/test-batch-analysis.html` for batch processing validation
- `frontend/test_peak_detection.html` for peak detection algorithm testing
- Sample videos available in `resource/` directory

## File Structure Context

### Core Application Files
- `backend/main.py` - Main FastAPI application and video processing logic
- `frontend/script.js` - Core frontend interaction logic (1345+ lines)
- `frontend/styles.css` - VS Code-themed styling
- `frontend/serve.py` - Development server with no-cache headers
- `frontend/index.html` - Main application interface
- `serve.py` - Root-level development server (same as frontend/serve.py)
- `check_syntax.js` - JavaScript syntax validation utility
- `start-frontend.ps1` - Windows PowerShell frontend server script

### Testing and Analysis Interfaces
- `frontend/curve-viewer.html` - Standalone curve analysis interface
- `frontend/analyze-csv.html` - CSV data analysis interface
- `frontend/test-batch-analysis.html` - Batch processing test interface
- `frontend/test-curve-data.html` - Curve data testing interface
- `frontend/test_peak_detection.html` - Peak detection algorithm testing
- `frontend/test_overlap_fix.html` - Overlap fix validation interface
- `frontend/test_realtime_updates.html` - Real-time update testing
- `frontend/test_corrected_logic.html` - Logic correction testing

### Legacy System (OldFEM)
- `OldFEM/` - Previous generation HEM Analyzer with screen-capture based analysis
- `OldFEM/server.py` - TCP server for real-time image processing (port 30415)
- `OldFEM/ocr_detect.py` - OCR functionality using PaddleOCR for measurement extraction
- `OldFEM/treat_compare_img.py` - Treatment comparison with real-time screenshot capture
- `OldFEM/image_difference.py` - Advanced image difference detection with multiple filters
- `OldFEM/Analysis.py` - 3D trajectory analysis for Aimooe dual-camera coordinate data
- `OldFEM/settings` - JSON configuration file with GPU support and thresholds
- `OldFEM/screenshots/` - Test images and historical data for algorithm validation

## Frontend Architecture Details

### Core Components
- **Video ROI Selection**: Interactive ROI with two modes:
  - Drag mode: Left-drag to select rectangle
  - Center-point mode: Click to set center with configurable dimensions
- **Real-time Visualization**: Six analysis curves with toggles:
  - Blue (Δv): Current frame ROI mean - historical mean
  - Yellow (d(Δv)): First-order derivative of blue curve
  - White: ROI average grayscale value
  - Pink: ROI standard deviation
  - Purple: High gray value ratio (>130)
  - Orange: Conditional high gray value ratio (>160 when average >120)
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

### Parameter Configuration Location
Algorithm parameters are configured in `backend/main.py` in the `detect_events()` function. Default values can be adjusted based on medical requirements and video characteristics.

## Legacy System (OldFEM)

### Overview
The `OldFEM/` directory contains the previous generation HEM Analyzer, which represents the evolutionary foundation of the current web-based system. This legacy implementation pioneered the core HEM detection algorithms using a screen-capture approach rather than video file processing.

### Architecture and Evolution
- **Original Approach**: Real-time screen capture from ultrasound displays with OCR for parameter extraction
- **Current Approach**: Web-based video upload with flexible ROI selection and REST API
- **Progression**: From specialized hardware-dependent system to generic video processing platform

### Key Legacy Technologies
- **OCR Integration**: PaddleOCR for real-time measurement extraction (Chinese/English)
- **TCP Server-Client**: Network communication (port 30415) for remote control
- **GPU Acceleration**: CUDA support with NVIDIA GPU monitoring
- **Advanced Image Processing**: Multiple filtering techniques (median, Gaussian, bilateral, wavelet)
- **Real-time Monitoring**: Continuous screenshot capture and grayscale analysis

### Algorithm Heritage
Many current detection methods evolved from OldFEM research:
- **Grayscale Monitoring**: Legacy real-time pixel analysis informed current video-based ROI analysis
- **Image Difference Detection**: Multi-filter approach evolved into current HEM event detection algorithms
- **Treatment Detection**: Before/after comparison logic adapted for video timeline analysis

### Development Reference
- **Algorithm Insights**: Reference `OldFEM/image_difference.py` for advanced filtering techniques
- **Test Data**: Use `OldFEM/screenshots/` for algorithm validation and historical comparison
- **Configuration**: `OldFEM/settings` provides baseline parameters and thresholds
- **3D Analysis**: `OldFEM/Analysis.py` contains trajectory analysis for coordinate-based studies

### Legacy Capabilities No Longer in Current System
- Real-time OCR of ultrasound measurements
- Direct hardware integration via screen capture
- TCP-based remote control interface
- Automated treatment detection with freeze detection