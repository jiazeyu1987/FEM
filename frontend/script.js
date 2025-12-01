{ // Script scope
  // FE build/version marker for cache-busting verification
  console.log('HEM FE version: two-curves-no-ticks v2025-11-06');
  const fileInput = document.getElementById('fileInput');
  const video = document.getElementById('video');
  const overlay = document.getElementById('overlay');
  const videoWrap = document.getElementById('videoWrap');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const statusEl = document.getElementById('status');
  const resultText = document.getElementById('resultText');
  const methodBadges = document.getElementById('methodBadges');
  const statsBox = document.getElementById('stats');
  const chart = document.getElementById('chart');
  const timeline = document.getElementById('timeline');
  const showBlueEl = document.getElementById('showBlue');
  const showYellowEl = document.getElementById('showYellow');
  const showWhiteRoiEl = document.getElementById('showWhiteRoi');
  const showPinkStdEl = document.getElementById('showPinkStd');
  const showPurpleHighEl = document.getElementById('showPurpleHigh');
  const showOrangeEl = document.getElementById('showOrange');
  const sampleFpsEl = document.getElementById('sampleFps');

  // Information panel elements
  const infoTimestampEl = document.getElementById('infoTimestamp');
  const infoBlueValueEl = document.getElementById('infoBlueValue');
  const infoYellowValueEl = document.getElementById('infoYellowValue');
  const infoWhiteValueEl = document.getElementById('infoWhiteValue');
  const infoPinkValueEl = document.getElementById('infoPinkValue');
  const infoPurpleValueEl = document.getElementById('infoPurpleValue');
  const infoOrangeValueEl = document.getElementById('infoOrangeValue');
  const infoStatusEl = document.getElementById('infoStatus');
  const clearInfoBtn = document.getElementById('clearInfoBtn');

  // Next interval panel elements
  const findNextIntervalBtn = document.getElementById('findNextIntervalBtn');
  const nextIntervalInfo = document.getElementById('nextIntervalInfo');
  const intervalStartFrameEl = document.getElementById('intervalStartFrame');
  const intervalEndFrameEl = document.getElementById('intervalEndFrame');
  const intervalTotalFramesEl = document.getElementById('intervalTotalFrames');
  const jumpToIntervalBtn = document.getElementById('jumpToIntervalBtn');
  const jumpToIntervalEndBtn = document.getElementById('jumpToIntervalEndBtn');
  const prevFrameBtn = document.getElementById('prevFrameBtn');
  const nextFrameBtn = document.getElementById('nextFrameBtn');
  const noIntervalInfo = document.getElementById('noIntervalInfo');

  // Interval statistics elements
  const intervalStatistics = document.getElementById('intervalStatistics');
  const blueStatMin = document.getElementById('blueStatMin');
  const blueStatMax = document.getElementById('blueStatMax');
  const blueStatAvg = document.getElementById('blueStatAvg');
  const yellowStatMin = document.getElementById('yellowStatMin');
  const yellowStatMax = document.getElementById('yellowStatMax');
  const yellowStatAvg = document.getElementById('yellowStatAvg');
  const whiteStatMin = document.getElementById('whiteStatMin');
  const whiteStatMax = document.getElementById('whiteStatMax');
  const whiteStatAvg = document.getElementById('whiteStatAvg');
  const pinkStatMin = document.getElementById('pinkStatMin');
  const pinkStatMax = document.getElementById('pinkStatMax');
  const pinkStatAvg = document.getElementById('pinkStatAvg');
  const purpleStatMin = document.getElementById('purpleStatMin');
  const purpleStatMax = document.getElementById('purpleStatMax');
  const purpleStatAvg = document.getElementById('purpleStatAvg');
  const orangeStatMin = document.getElementById('orangeStatMin');
  const orangeStatMax = document.getElementById('orangeStatMax');
  const orangeStatAvg = document.getElementById('orangeStatAvg');

  // Batch analysis elements
  const batchFileInput = document.getElementById('batchFileInput');
  const batchLoadBtn = document.getElementById('batchLoadBtn');
  const dropZone = document.getElementById('dropZone');
  const batchFileList = document.getElementById('batchFileList');
  const fileListItems = document.getElementById('fileListItems');
  const fileCount = document.getElementById('fileCount');
  const clearFilesBtn = document.getElementById('clearFilesBtn');
  const batchAnalyzeBtn = document.getElementById('batchAnalyzeBtn');
  const batchDeepAnalyzeBtn = document.getElementById('batchDeepAnalyzeBtn');
  const batchProgress = document.getElementById('batchProgress');
  const progressText = document.getElementById('progressText');
  const progressFill = document.getElementById('progressFill');
  const batchStatus = document.getElementById('batchStatus');
  const deepAnalysisProgress = document.getElementById('deepAnalysisProgress');
  const deepProgressText = document.getElementById('deepProgressText');
  const deepProgressFill = document.getElementById('deepProgressFill');
  const deepAnalysisStatus = document.getElementById('deepAnalysisStatus');
  const videoSelector = document.getElementById('videoSelector');

  // Export and batch charts elements
  const exportCurveDataBtn = document.getElementById('exportCurveDataBtn');
  const batchChartsBtn = document.getElementById('batchChartsBtn');
  const curveDataUpload = document.getElementById('curveDataUpload');
  const curveDataDropZone = document.getElementById('curveDataDropZone');
  const curveDataFileInput = document.getElementById('curveDataFileInput');
  const curveDataLoadBtn = document.getElementById('curveDataLoadBtn');
  const batchChartsContainer = document.getElementById('batchChartsContainer');
  const chartsGrid = document.getElementById('chartsGrid');
  const clearBatchChartsBtn = document.getElementById('clearBatchChartsBtn');

  // Batch chart curve toggles
  const batchShowWhite = document.getElementById('batchShowWhite');
  const batchShowBlue = document.getElementById('batchShowBlue');
  const batchShowYellow = document.getElementById('batchShowYellow');
  const batchShowPink = document.getElementById('batchShowPink');
  const batchShowPurple = document.getElementById('batchShowPurple');
  const batchShowOrange = document.getElementById('batchShowOrange');

  // Peak detection UI elements
  const peakSensitivityEl = document.getElementById('peakSensitivity');
  const peakMinDistanceEl = document.getElementById('peakMinDistance');
  const detectPeaksBtn = document.getElementById('detectPeaksBtn');
  const clearPeaksBtn = document.getElementById('clearPeaksBtn');

  const methodsEls = document.querySelectorAll('.method');
  const blueMaxThreshEl = document.getElementById('blue_max_thresh');
  // parameter inputs
  const p = {
    smooth_k: document.getElementById('p_smooth_k'),
    baseline_n: document.getElementById('p_baseline_n'),
    sudden_k: document.getElementById('p_sudden_k'),
    sudden_min: document.getElementById('p_sudden_min'),
    threshold_delta: document.getElementById('p_threshold_delta'),
    threshold_hold: document.getElementById('p_threshold_hold'),
    relative_delta: document.getElementById('p_relative_delta'),
    high_threshold: document.getElementById('p_high_threshold'),
    conditional_threshold1: document.getElementById('conditional_threshold1'),
    conditional_threshold2: document.getElementById('conditional_threshold2'),
    // timeline shading thresholds (frontend-only)
    rise_thresh: document.getElementById('p_rise_thresh'),
    fall_thresh: document.getElementById('p_fall_thresh'),
  };

  // ROI mode UI elements
  const roiModeRadios = document.querySelectorAll('input[name="roiMode"]');
  const roiParamsDiv = document.getElementById('roiParams');
  const roiWidthInput = document.getElementById('roiWidth');
  const roiHeightInput = document.getElementById('roiHeight');
  const hintEl = document.querySelector('.hint');

  let roi = null; // normalized {x,y,w,h}
  let dragging = false; let start = null; let rectPx = null;
  let analyzedXs = []; let analyzedEvents = []; let analyzedSeries = []; let analyzedBaseline = 0;
  let shadedIntervals = []; // [{start, end}] regions to shade on timeline
  let detectedPeaks = []; // [{frame, time, value}] detected white curve peaks
  let lastBlueJudge = null;
  const timelineState = { fullMin: 0, fullMax: 0, min: 0, max: 0 };
  let zoom = 1.0;
  let panX = 0, panY = 0; // videoWrap translation in panel pixels
  let isPanning = false; let panStart = {x:0,y:0}; let panOrigin = {x:0,y:0};
  let roiVisible = true;

  // ROI mode variables
  let roiMode = 'drag'; // 'drag' or 'center'
  let roiCenter = null; // center point coordinates {x, y}
  let roiDimensions = {w: 100, h: 200}; // pixel dimensions
  let placingCenter = false;
  const chartState = { showBlue: (showBlueEl? showBlueEl.checked : true), showYellow: (showYellowEl? showYellowEl.checked : true), showWhiteRoi: (showWhiteRoiEl? showWhiteRoiEl.checked : true), showPinkStd: (showPinkStdEl? showPinkStdEl.checked : true), showPurpleHigh: (showPurpleHighEl? showPurpleHighEl.checked : true), showOrange: (showOrangeEl? showOrangeEl.checked : true), yZoom: 1, padLeft: 56 };

  // Initialize frame navigation buttons to always enabled state
  updateFrameNavigationButtons();

  // Batch analysis variables
  const batchAnalyses = new Map(); // videoId -> analysisData
  let currentVideoId = null;        // Currently displayed analysis ID
  let batchFiles = [];               // Array of selected files

  // Deep analysis variables
  const deepAnalysisResults = new Map(); // videoId -> deepAnalysisData
  let deepAnalysisProcessing = false;    // Whether deep analysis is active

  // Batch charts variables
  let batchCurveData = []; // Array of video curve data for batch visualization
  let batchChartInstances = []; // Array of chart canvas elements
  let batchChartState = {
    showWhite: true,
    showBlue: true,
    showYellow: true,
    showPink: true,
    showPurple: true,
    showOrange: true
  };
  let batchScrolling = {
    active: false,
    visibleStartIndex: 0,
    visibleEndIndex: 0,
    renderedCharts: new Set()
  };
  const batchQueue = {
    videos: [],           // Array of analysisData
    processing: false,    // Whether batch processing is active
    currentIndex: 0,      // Currently processing video index
    paused: false,        // Whether processing is paused
    cancelled: false      // Whether batch was cancelled
  };

  // Load video preview
  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    video.src = url;
    analyzeBtn.disabled = !(roi && roi.w > 0 && roi.h > 0);
    resultText.textContent = '加载视频，选择ROI后点击分析…';
  });

  // Resize overlay to match video client size
  const resizeOverlay = () => {
    // Use intrinsic video size as base; fall back to client rect if unavailable
    const vw = Math.max(1, Math.floor(video.videoWidth || video.clientWidth || 640));
    const vh = Math.max(1, Math.floor(video.videoHeight || video.clientHeight || 360));
    overlay.width = vw; overlay.height = vh;
    overlay.style.width = vw + 'px'; overlay.style.height = vh + 'px';
    // wrap dimensions follow base size; scaling + translation applied to fit
    videoWrap.style.width = vw + 'px';
    videoWrap.style.height = vh + 'px';
    videoWrap.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    drawOverlay();
  };

  function applyExistingRoiToOverlay() {
    // Check if there's a valid ROI and apply it to the overlay
    if (roi && roi.w > 0 && roi.h > 0) {
      drawOverlay();
      return true;
    }
    return false;
  }

  function autoFitHeight(){
    // Fit video height to available box height while keeping aspect ratio
    const box = document.querySelector('.video-box');
    if (!box) return;
    const vh = Math.max(1, Math.floor(video.videoHeight || 360));
    const availH = Math.max(1, Math.floor(box.clientHeight));
    const targetZoom = clamp(availH / vh, 0.1, 10);
    zoom = targetZoom; panX = 0; panY = 0; // initial fit aligns to top-left; user can pan later
    resizeOverlay();
  }
  new ResizeObserver(() => { autoFitHeight(); }).observe(document.querySelector('.video-box'));
  video.addEventListener('loadedmetadata', () => { autoFitHeight(); if (applyExistingRoiToOverlay()) analyzeBtn.disabled = false; });
  window.addEventListener('resize', () => { autoFitHeight(); });

  function drawOverlay(){
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0,0,overlay.width, overlay.height);

    if (rectPx && roiVisible){
      // Use different colors for different modes
      if (roiMode === 'center') {
        ctx.strokeStyle = '#f59e0b'; // Yellow/orange for center-point mode
        ctx.fillStyle = 'rgba(245,158,11,0.15)';
      } else {
        ctx.strokeStyle = '#4fc3f7'; // Blue for drag mode
        ctx.fillStyle = 'rgba(79,195,247,0.15)';
      }

      ctx.lineWidth = 2;
      ctx.strokeRect(rectPx.x, rectPx.y, rectPx.w, rectPx.h);
      ctx.fillRect(rectPx.x, rectPx.y, rectPx.w, rectPx.h);

      // Show center point in center-point mode
      if (roiMode === 'center' && roiCenter) {
        ctx.strokeStyle = '#ef4444'; // Red for center marker
        ctx.fillStyle = '#ef4444';
        ctx.lineWidth = 1;

        // Draw crosshair at center point
        const crossSize = 8;
        ctx.beginPath();
        ctx.moveTo(roiCenter.x - crossSize, roiCenter.y);
        ctx.lineTo(roiCenter.x + crossSize, roiCenter.y);
        ctx.moveTo(roiCenter.x, roiCenter.y - crossSize);
        ctx.lineTo(roiCenter.x, roiCenter.y + crossSize);
        ctx.stroke();

        // Draw center dot
        ctx.beginPath();
        ctx.arc(roiCenter.x, roiCenter.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

  function localPos(e){
    const rect = overlay.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / Math.max(zoom,1e-6), y: (e.clientY - rect.top) / Math.max(zoom,1e-6) };
  }

  // ROI mode switching logic
  function updateHintText() {
    if (roiMode === 'drag') {
      hintEl.textContent = 'Select ROI: left-drag; middle button pan; right toggles';
    } else {
      hintEl.textContent = '中心点模式: 左键点击设置中心点; 中键平移; 右键切换显示';
    }
  }

  function switchRoiMode(newMode) {
    roiMode = newMode;
    roiParamsDiv.style.display = newMode === 'center' ? 'grid' : 'none';
    updateHintText();
    // Clear existing ROI when switching modes
    roi = null;
    roiCenter = null;
    rectPx = null;
    drawOverlay();
  }

  // Add event listeners for ROI mode switching
  roiModeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        switchRoiMode(radio.value);
      }
    });
  });

  // Add event listeners for dimension inputs
  if (roiWidthInput) {
    roiWidthInput.addEventListener('input', () => {
      roiDimensions.w = parseInt(roiWidthInput.value) || 100;
      if (roiMode === 'center' && roiCenter) {
        updateRoiFromCenter();
      }
    });
  }

  if (roiHeightInput) {
    roiHeightInput.addEventListener('input', () => {
      roiDimensions.h = parseInt(roiHeightInput.value) || 200;
      if (roiMode === 'center' && roiCenter) {
        updateRoiFromCenter();
      }
    });
  }

  function centerToNormalized(center, dims, videoW, videoH) {
    return {
      x: (center.x - dims.w/2) / videoW,
      y: (center.y - dims.h/2) / videoH,
      w: dims.w / videoW,
      h: dims.h / videoH
    };
  }

  function updateRoiFromCenter() {
    if (!roiCenter) return;
    roi = centerToNormalized(roiCenter, roiDimensions, overlay.width, overlay.height);
    // Update rectPx for drawing
    rectPx = {
      x: roiCenter.x - roiDimensions.w/2,
      y: roiCenter.y - roiDimensions.h/2,
      w: roiDimensions.w,
      h: roiDimensions.h
    };
    drawOverlay();
    if (roi) {
      analyzeBtn.disabled = false;
      updateRoiStatus();
    }
  }

  // Batch analysis functions
  function generateVideoId(file) {
    return file.name + '_' + file.size + '_' + file.lastModified;
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function addBatchFiles(files) {
    const mp4Files = Array.from(files).filter(file => file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4'));

    mp4Files.forEach(file => {
      const videoId = generateVideoId(file);
      if (!batchFiles.find(f => generateVideoId(f) === videoId)) {
        batchFiles.push(file);
      }
    });

    updateBatchFileList();
  }

  function removeBatchFile(videoId) {
    const index = batchFiles.findIndex(file => generateVideoId(file) === videoId);
    if (index !== -1) {
      batchFiles.splice(index, 1);
      updateBatchFileList();
    }
  }

  function clearBatchFiles() {
    batchFiles = [];
    updateBatchFileList();
  }

  function updateBatchFileList() {
    if (batchFiles.length === 0) {
      batchFileList.style.display = 'none';
      batchAnalyzeBtn.disabled = true;
      batchDeepAnalyzeBtn.disabled = true;
    } else {
      batchFileList.style.display = 'block';
      batchAnalyzeBtn.disabled = false;
      batchDeepAnalyzeBtn.disabled = false;
      fileCount.textContent = batchFiles.length;

      // Update file list items
      fileListItems.innerHTML = '';
      batchFiles.forEach(file => {
        const videoId = generateVideoId(file);
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
          <div class="file-item-info">
            <div class="file-item-name" title="${file.name}">${file.name}</div>
            <div class="file-item-size">${formatFileSize(file.size)}</div>
          </div>
          <div class="file-item-status">
            <button class="file-item-remove" data-video-id="${videoId}">移除</button>
          </div>
        `;
        fileListItems.appendChild(fileItem);
      });

      // Add remove event listeners
      document.querySelectorAll('.file-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const videoId = e.target.getAttribute('data-video-id');
          removeBatchFile(videoId);
        });
      });
    }
  }

  function updateBatchProgress(current, total, status) {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    progressText.textContent = `${percentage}% (${current}/${total})`;
    progressFill.style.width = `${percentage}%`;
    batchStatus.textContent = status;
  }

  function showBatchProgress(show = true) {
    batchProgress.style.display = show ? 'block' : 'none';
  }

  function createAnalysisData(file) {
    const videoId = generateVideoId(file);
    return {
      id: videoId,
      fileName: file.name,
      file: file,
      status: 'pending',
      progress: 0,
      error: null,
      roi: null, // Will be set when user selects ROI for this video
      results: {
        has_hem: false,
        events: [],
        baseline: 0,
        series: []
      },
      metadata: {
        duration: 0,
        fps: 8,
        width: 0,
        height: 0
      }
    };
  }
  overlay.addEventListener('mousedown', (e)=>{
    if (e.button === 1){ // middle button: pan
      e.preventDefault();
      isPanning = true; panStart = {x: e.clientX, y: e.clientY}; panOrigin = {x: panX, y: panY};
      overlay.classList.add('panning');
      return;
    }
    if (e.button === 2){ // right button: toggle ROI visibility
      e.preventDefault();
      roiVisible = !roiVisible; drawOverlay();
      return;
    }
    if (e.button !== 0) return; // only left button draws ROI
    const p = localPos(e);

    if (roiMode === 'center') {
      // Center-point mode: set center and create ROI immediately
      roiCenter = {x: p.x, y: p.y};
      updateRoiFromCenter();
    } else {
      // Drag mode: start dragging
      start = {x: p.x, y: p.y};
      dragging = true; rectPx = {x:start.x, y:start.y, w:0, h:0};
      drawOverlay();
    }
  });
  overlay.addEventListener('mousemove', (e)=>{
    if(!dragging) return;
    const p = localPos(e);
    const x = clamp(p.x, 0, overlay.width);
    const y = clamp(p.y, 0, overlay.height);
    rectPx.x = Math.min(start.x, x);
    rectPx.y = Math.min(start.y, y);
    rectPx.w = Math.abs(x - start.x);
    rectPx.h = Math.abs(y - start.y);
    drawOverlay();
  });
  function finishDrag(){
    if (!dragging) return;
    dragging = false;
    if(rectPx && rectPx.w > 3 && rectPx.h > 3){
      roi = {
        x: rectPx.x / overlay.width,
        y: rectPx.y / overlay.height,
        w: rectPx.w / overlay.width,
        h: rectPx.h / overlay.height,
      };
      analyzeBtn.disabled = !(fileInput.files && fileInput.files[0]);
      statusEl.textContent = `ROI = x:${roi.x.toFixed(3)}, y:${roi.y.toFixed(3)}, w:${roi.w.toFixed(3)}, h:${roi.h.toFixed(3)}`;
    }
  }

  // Update status text for center-point mode ROI
  function updateRoiStatus() {
    if (!roi) return;
    statusEl.textContent = `ROI = x:${roi.x.toFixed(3)}, y:${roi.y.toFixed(3)}, w:${roi.w.toFixed(3)}, h:${roi.h.toFixed(3)}`;
  }
  overlay.addEventListener('mouseup', finishDrag);
  overlay.addEventListener('mouseleave', finishDrag);
  window.addEventListener('mouseup', ()=>{ if (isPanning){ isPanning=false; overlay.classList.remove('panning'); }});
  window.addEventListener('mousemove', (e)=>{
    if (!isPanning) return;
    const dx = e.clientX - panStart.x; const dy = e.clientY - panStart.y;
    panX = panOrigin.x + dx; panY = panOrigin.y + dy;
    videoWrap.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  });
  overlay.addEventListener('contextmenu', (e)=>{ e.preventDefault(); });

  function selectedMethods(){
    return Array.from(methodsEls).filter(el=>el.checked).map(el=>el.value).join(',');
  }

  analyzeBtn.addEventListener('click', async ()=>{
    const file = fileInput.files && fileInput.files[0];
    if (!file){ alert('请先选择视频'); return; }
    if (!roi){ alert('请在视频上框选ROI'); return; }
    resultText.textContent = '分析中…';
    statusEl.textContent = '上传并调用后端接口 /analyze';
    analyzeBtn.disabled = !(roi && roi.w > 0 && roi.h > 0);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('roi_x', String(roi.x));
      fd.append('roi_y', String(roi.y));
      fd.append('roi_w', String(roi.w));
      fd.append('roi_h', String(roi.h));
      fd.append('sample_fps', String(Number(sampleFpsEl.value || 8)));
      fd.append('methods', selectedMethods());
      // attach parameters (optional)
      Object.entries(p).forEach(([key, el])=>{
        if (el) {
          let value = el.value;
          // Ensure default values for critical parameters
          if (key === 'conditional_threshold1' && (value === '' || value === undefined)) {
            value = '120';
          }
          if (key === 'conditional_threshold2' && (value === '' || value === undefined)) {
            value = '160';
          }
          if (key === 'high_threshold' && (value === '' || value === undefined)) {
            value = '130';
          }
          fd.append(key, String(value));
        }
      });

      // Debug: Log parameters being sent
      console.log('📤 Sending analysis parameters:');
      Object.entries(p).forEach(([key, el]) => {
        if (el) {
          let value = el.value;
          if (key === 'conditional_threshold1' && (value === '' || value === undefined)) value = '120';
          if (key === 'conditional_threshold2' && (value === '' || value === undefined)) value = '160';
          if (key === 'high_threshold' && (value === '' || value === undefined)) value = '130';
          console.log(`  - ${key}: ${value}`);
        }
      });

      const resp = await fetch('http://localhost:8421/analyze', { method:'POST', body: fd });
      if (!resp.ok){ throw new Error('后端分析失败'); }
      const data = await resp.json();
      renderResult(data);
      analyzeBtn.disabled = false;
    } catch (e){
      console.error(e);
      resultText.textContent = '请求失败：' + e.message;
      analyzeBtn.disabled = false;
    }
  });

function renderResult(data){
  const { has_hem, events = [], baseline = 0, series = [] } = data;
  const hitColor = has_hem ? '#22c55e' : '#9da0a6';
  const hitText  = has_hem ? ('Detected HEM events: ' + String(events.length)) : 'No events detected';
  resultText.innerHTML = '<span style="color:' + hitColor + '">' + hitText + '</span>';

  const hasSudden = events.some(e=>e.type==='sudden');
  const hasThreshold = events.some(e=>e.type==='threshold');
  const hasRelative = events.some(e=>e.type==='relative');
  methodBadges.innerHTML = [
    badge('Sudden', hasSudden),
    badge('Threshold', hasThreshold),
    badge('Relative', hasRelative)
  ].join('');

  if (!series.length){
    statsBox.innerHTML = '';
    renderChart([], [], baseline, []);
    renderTimeline([], []);
      return;
  }

  const xs = series.map(p=>p.t);
  const roi = series.map(p=>p.roi);
  const ref = series.map(p=>p.ref);
  const std = series.map(p=>p.std);
  const high = series.map(p=>p.high);
  const dif = roi.map((v,i)=> v - ref[i]);
  const maxJump = (function(arr){ let m=0; for(let i=1;i<arr.length;i++){ m=Math.max(m, arr[i]-arr[i-1]); } return m; })(roi);
  const stats = [
    stat('Baseline', baseline.toFixed(2)),
    stat('ROI mean', (roi.reduce((a,b)=>a+b,0)/Math.max(1,roi.length)).toFixed(2)),
    stat('ROI max', Math.max(...roi).toFixed(2)),
    stat('Max jump', maxJump.toFixed(2)),
    stat('Max diff', Math.max(...dif).toFixed(2)),
    stat('Duration', fmtTime(xs[xs.length-1]||0))
  ];
  statsBox.innerHTML = stats.join('');

  renderChart(xs, series, baseline, events);
  analyzedXs = xs; analyzedEvents = events; analyzedSeries = series; analyzedBaseline = baseline;
  recomputeShadedIntervals();
  const seriesStart = xs.length ? xs[0] : 0;
  const seriesEnd = xs.length ? xs[xs.length-1] : 0;
  timelineState.fullMin = seriesStart;
  timelineState.fullMax = seriesEnd;
  timelineState.min = seriesStart;
  timelineState.max = seriesEnd;
  renderTimeline();
  updateBlueJudge();

  // Enable peak detection controls after analysis is complete
  enablePeakDetectionControls();
}

// thresholds helper (kept close to shading logic)
function getThresholds(){
  const riseInput = document.getElementById('p_rise_thresh');
  const fallInput = document.getElementById('p_fall_thresh');
  const rise = Number((riseInput && riseInput.value) || 15.5);
  const fall = Number((fallInput && fallInput.value) || -3);
  return { rise, fall };
}

// Next interval functions
function findNextShadedInterval(currentTime) {
  if (!shadedIntervals || shadedIntervals.length === 0) {
    return null;
  }

  // Find the first interval that starts after currentTime
  for (let i = 0; i < shadedIntervals.length; i++) {
    const interval = shadedIntervals[i];
    if (interval.start > currentTime) {
      return interval;
    }
  }

  return null; // No interval found after currentTime
}

function calculateIntervalFrames(interval, sampleFps) {
  if (!interval || !sampleFps || sampleFps <= 0) {
    return { startFrame: 0, endFrame: 0, totalFrames: 0 };
  }

  const startFrame = Math.floor(interval.start * sampleFps);
  const endFrame = Math.floor(interval.end * sampleFps);
  const totalFrames = endFrame - startFrame + 1;

  return { startFrame, endFrame, totalFrames };
}

function calculateIntervalStatistics(interval) {
  if (!interval || !analyzedXs || !analyzedXs.length || !analyzedSeries || !analyzedSeries.length) {
    return null;
  }

  // Find indices for the interval time range
  const startIndex = analyzedXs.findIndex(t => t >= interval.start);
  let endIndex = analyzedXs.findIndex(t => t > interval.end);
  if (endIndex === -1) endIndex = analyzedXs.length;
  endIndex -= 1; // Include the last point within interval

  if (startIndex === -1 || endIndex < startIndex || endIndex >= analyzedSeries.length) {
    return null;
  }

  // Extract curve data within the interval
  const intervalData = {
    white: analyzedSeries.slice(startIndex, endIndex + 1).map(p => p.roi),
    pink: analyzedSeries.slice(startIndex, endIndex + 1).map(p => p.std || 0),
    purple: analyzedSeries.slice(startIndex, endIndex + 1).map(p => p.high || 0),
    orange: analyzedSeries.slice(startIndex, endIndex + 1).map(p => p.orange || 0)
  };

  // Calculate blue curve (d1) values
  const roiValues = analyzedSeries.map(p => p.roi);
  const blueValues = [];
  for (let i = 0; i < roiValues.length; i++) {
    if (i === 0) {
      blueValues.push(0);
    } else {
      const base = analyzedBaseline || 0;
      blueValues.push(roiValues[i] - base);
    }
  }
  intervalData.blue = blueValues.slice(startIndex, endIndex + 1);

  // Calculate yellow curve (d2) - first derivative of blue
  intervalData.yellow = [];
  for (let i = 0; i < intervalData.blue.length; i++) {
    if (i === 0) {
      intervalData.yellow.push(0);
    } else {
      intervalData.yellow.push(intervalData.blue[i] - intervalData.blue[i-1]);
    }
  }

  // Calculate statistics for each curve
  const calculateStats = (data) => {
    if (!data || data.length === 0) return { min: 0, max: 0, avg: 0 };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
    return { min, max, avg };
  };

  return {
    blue: calculateStats(intervalData.blue),
    yellow: calculateStats(intervalData.yellow),
    white: calculateStats(intervalData.white),
    pink: calculateStats(intervalData.pink),
    purple: calculateStats(intervalData.purple),
    orange: calculateStats(intervalData.orange)
  };
}

function updateNextIntervalInfo(currentTime) {
  const nextInterval = findNextShadedInterval(currentTime);
  const sampleFps = Number(sampleFpsEl?.value || 8);

  if (nextInterval) {
    const frames = calculateIntervalFrames(nextInterval, sampleFps);
    const statistics = calculateIntervalStatistics(nextInterval);

    // Update interval info display
    intervalStartFrameEl.textContent = frames.startFrame;
    intervalEndFrameEl.textContent = frames.endFrame;
    intervalTotalFramesEl.textContent = frames.totalFrames;

    // Update statistics display
    if (statistics) {
      // Blue curve statistics
      blueStatMin.textContent = statistics.blue.min.toFixed(3);
      blueStatMax.textContent = statistics.blue.max.toFixed(3);
      blueStatAvg.textContent = statistics.blue.avg.toFixed(3);

      // Yellow curve statistics
      yellowStatMin.textContent = statistics.yellow.min.toFixed(3);
      yellowStatMax.textContent = statistics.yellow.max.toFixed(3);
      yellowStatAvg.textContent = statistics.yellow.avg.toFixed(3);

      // White curve statistics
      whiteStatMin.textContent = statistics.white.min.toFixed(1);
      whiteStatMax.textContent = statistics.white.max.toFixed(1);
      whiteStatAvg.textContent = statistics.white.avg.toFixed(1);

      // Pink curve statistics
      pinkStatMin.textContent = statistics.pink.min.toFixed(3);
      pinkStatMax.textContent = statistics.pink.max.toFixed(3);
      pinkStatAvg.textContent = statistics.pink.avg.toFixed(3);

      // Purple curve statistics
      purpleStatMin.textContent = statistics.purple.min.toFixed(1);
      purpleStatMax.textContent = statistics.purple.max.toFixed(1);
      purpleStatAvg.textContent = statistics.purple.avg.toFixed(1);

      // Orange curve statistics
      orangeStatMin.textContent = statistics.orange.min.toFixed(1);
      orangeStatMax.textContent = statistics.orange.max.toFixed(1);
      orangeStatAvg.textContent = statistics.orange.avg.toFixed(1);

      // Show statistics section
      intervalStatistics.style.display = 'block';
    } else {
      // Hide statistics if calculation failed
      intervalStatistics.style.display = 'none';
    }

    // Store current interval for jump functionality
    window.currentNextInterval = nextInterval;
  } else {
    // Keep interval info visible, show default values
    intervalStartFrameEl.textContent = '--';
    intervalEndFrameEl.textContent = '--';
    intervalTotalFramesEl.textContent = '--';

    // Clear statistics display
    blueStatMin.textContent = '--';
    blueStatMax.textContent = '--';
    blueStatAvg.textContent = '--';
    yellowStatMin.textContent = '--';
    yellowStatMax.textContent = '--';
    yellowStatAvg.textContent = '--';
    whiteStatMin.textContent = '--';
    whiteStatMax.textContent = '--';
    whiteStatAvg.textContent = '--';
    pinkStatMin.textContent = '--';
    pinkStatMax.textContent = '--';
    pinkStatAvg.textContent = '--';
    purpleStatMin.textContent = '--';
    purpleStatMax.textContent = '--';
    purpleStatAvg.textContent = '--';
    orangeStatMin.textContent = '--';
    orangeStatMax.textContent = '--';
    orangeStatAvg.textContent = '--';

    // Hide statistics section
    intervalStatistics.style.display = 'none';

    // Hide no interval message, keep interval info visible
    nextIntervalInfo.style.display = 'block';
    noIntervalInfo.style.display = 'none';

    // Clear stored interval
    window.currentNextInterval = null;
  }

  }

function jumpToInterval(interval) {
  if (!interval || !video) {
    return;
  }

  // Jump to the start of the interval
  video.currentTime = interval.start;
  renderTimeline();
  rerenderAll();
}

function jumpToIntervalEnd(interval) {
  if (!interval || !video) {
    return;
  }

  // Jump to the end of the interval
  video.currentTime = interval.end;
  renderTimeline();
  rerenderAll();
}

function navigateToPreviousFrame(interval) {
  const sampleFps = Number(sampleFpsEl?.value || 8);
  const frameStep = 1 / sampleFps; // Time duration of one frame
  const currentTime = video.currentTime || 0;

  // Calculate new time, allow navigation without interval boundary restrictions
  const newTime = currentTime - frameStep;

  if (video) {
    video.currentTime = Math.max(0, newTime); // Only prevent going below 0
    renderTimeline();
    rerenderAll();
  }
}

function navigateToNextFrame(interval) {
  const sampleFps = Number(sampleFpsEl?.value || 8);
  const frameStep = 1 / sampleFps; // Time duration of one frame
  const currentTime = video.currentTime || 0;

  // Calculate new time, allow navigation without interval boundary restrictions
  const newTime = currentTime + frameStep;

  if (video) {
    video.currentTime = newTime; // Allow navigation beyond video duration, browser will handle it
    renderTimeline();
    rerenderAll();
  }
}

function updateFrameNavigationButtons() {
  // Always enable frame navigation buttons regardless of conditions
  if (prevFrameBtn) prevFrameBtn.disabled = false;
  if (nextFrameBtn) nextFrameBtn.disabled = false;
}

// Peak detection functions
function detectWhiteCurvePeaks(sensitivity = 2.0, minDistance = 5) {
  if (!analyzedSeries || analyzedSeries.length === 0) {
    console.warn('No data available for peak detection');
    return [];
  }

  // Extract white curve data (ROI average grayscale values)
  const whiteCurve = analyzedSeries.map(p => p.roi);
  const peaks = [];

  // Calculate first derivative using finite differences
  const derivative = new Array(whiteCurve.length).fill(0);
  for (let i = 1; i < whiteCurve.length; i++) {
    derivative[i] = whiteCurve[i] - whiteCurve[i - 1];
  }

  // Find zero-crossings from positive to negative (peak detection)
  let lastPeakIndex = -minDistance; // Ensure minimum distance between peaks

  for (let i = 1; i < derivative.length - 1; i++) {
    // Check for zero crossing: derivative goes from positive to negative
    if (derivative[i] > 0 && derivative[i + 1] < 0) {
      // Linear interpolation to find more precise peak position
      const peakIndex = i + (-derivative[i]) / (derivative[i + 1] - derivative[i]);

      // Check minimum distance constraint
      if (peakIndex - lastPeakIndex >= minDistance) {
        const peakValue = whiteCurve[Math.round(peakIndex)];

        // Apply sensitivity threshold (minimum peak height)
        if (peakValue >= sensitivity) {
          peaks.push({
            frame: Math.round(peakIndex),
            time: analyzedXs[Math.round(peakIndex)] || 0,
            value: peakValue
          });
          lastPeakIndex = peakIndex;
        }
      }
    }
  }

  console.log(`Detected ${peaks.length} peaks with sensitivity=${sensitivity}, minDistance=${minDistance}`);
  return peaks;
}

function clearTimelineMarkers() {
  // Clear all existing timeline markers
  shadedIntervals = [];
  // Peaks will be cleared separately by setting detectedPeaks = []
  console.log('Cleared all timeline markers');
}

function updatePeakDetection() {
  if (!analyzedSeries || analyzedSeries.length === 0) {
    alert('请先分析视频后再检测波峰');
    return;
  }

  const sensitivity = Number(peakSensitivityEl.value);
  const minDistance = Number(peakMinDistanceEl.value);

  // Detect peaks
  detectedPeaks = detectWhiteCurvePeaks(sensitivity, minDistance);

  // Clear existing timeline markers
  clearTimelineMarkers();

  // Update timeline to show peaks
  renderTimeline();

  // Update UI
  if (detectedPeaks.length > 0) {
    statusEl.textContent = `检测到 ${detectedPeaks.length} 个波峰`;
  } else {
    statusEl.textContent = '未检测到波峰';
  }

  // Update button states
  enablePeakDetectionControls();
}

function clearPeaks() {
  detectedPeaks = [];
  renderTimeline();
  statusEl.textContent = '已清除波峰标记';

  // Update button states
  enablePeakDetectionControls();
}

  function recomputeShadedIntervals(){
    if (!analyzedSeries || !analyzedSeries.length || !analyzedXs || !analyzedXs.length){ shadedIntervals = []; return; }
    const xs = analyzedXs;
    const v = analyzedSeries.map(p=>p.roi);
    const d1 = new Array(v.length).fill(0);
    let acc = 0;
    for (let i=0;i<v.length;i++){
      if (i===0){ d1[i]=0; acc+=v[i]; continue; }
      const prevMean = acc / i; d1[i] = v[i] - prevMean; acc += v[i];
    }
    const d2 = d1.map((_,i)=> i>0 ? (d1[i]-d1[i-1]) : 0);
    const { rise, fall } = getThresholds();
    function crossTime(t1,v1,t2,v2,thr){ const dv=v2-v1; if (Math.abs(dv)<1e-9) return t2; const r=(thr-v1)/dv; const cl=Math.max(0,Math.min(1,r)); return t1 + cl*(t2-t1); }
    const intervals = [];
    // Use BLUE curve (d1) for crossings: up across +rise, then down across +fall
    // signal = d1
    const signal = d1;
    let inSeg = false; let startT = null;
    for (let i=1;i<signal.length;i++){
      const t1=xs[i-1], t2=xs[i]; const v1=signal[i-1], v2=signal[i];
      if (!inSeg && (v1 < rise && v2 >= rise)){
        startT = crossTime(t1, v1, t2, v2, rise); inSeg = true; continue;
      }
      if (inSeg && (v1 > fall && v2 <= fall)){
        const endT = crossTime(t1, v1, t2, v2, fall); intervals.push({ start:startT, end:endT }); inSeg=false; startT=null;
      }
    }
    if (inSeg){ intervals.push({ start: startT, end: xs[xs.length-1] }); }
    shadedIntervals = intervals; updateBlueJudge();
  }

  function badge(label, ok){
    return `<span class="badge ${ok?'ok':'no'}">${label}: ${ok?'\u547D\u4E2D':'\u672A\u547D\u4E2D'}</span>`;
  }
  function stat(k, v){
    return `<div class="stat"><span class="k">${k}</span><span class="v">${v}</span></div>`;
  }
  function mean(arr){ return arr.reduce((a,b)=>a+b,0)/Math.max(1,arr.length); }
  function maxDiff(arr){
    let m = 0; for (let i=1;i<arr.length;i++){ m = Math.max(m, arr[i]-arr[i-1]); } return m;
  }
  function fmtTime(t){
    const mm = Math.floor(t/60); const ss = Math.floor(t%60); const ms = Math.round((t - Math.floor(t)) * 1000);
    return `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}.${String(ms).padStart(3,'0')}`;
  }

  function renderChart(xs, series, baseline, events){
    const ctx = chart.getContext('2d');
    // 与时间轴同宽，避免视觉长度不一致
    const targetW = (timeline.clientWidth || timeline.width || chart.clientWidth || chart.width || 600);
    chart.width = targetW; chart.style.width = targetW + 'px';
    const W = targetW; const H = chart.height;
    ctx.clearRect(0,0,W,H);
    if (!series.length) return;

    // ROI均值序列与派生曲线
    const v = series.map(p=>p.roi);
    const d1 = v.map((_,i)=> i>0 ? (v[i]-v[i-1]) : 0);            // 相邻帧灰度均值差 Δv
    const d2 = d1.map((_,i)=> i>1 ? (d1[i]-d1[i-1]) : 0);          // 差值变化 d(Δv)

    // 视图与时间轴同步
    let minX = xs[0]; let maxX = xs[xs.length-1];
    if (timelineState && (timelineState.max - timelineState.min) > 0){
      minX = Math.max(minX, timelineState.min || minX);
      maxX = Math.min(maxX, timelineState.max || maxX);
      if (maxX <= minX) { minX = xs[0]; maxX = xs[xs.length-1]; }
    }

    // 稳健纵轴范围（窗口内）
    function robustRange(arr){
      const a = arr.slice().filter(Number.isFinite).sort((x,y)=>x-y);
      if (a.length === 0) return [0,1];
      const med = a[Math.floor(a.length/2)];
      const dev = a.map(x=>Math.abs(x-med)).sort((x,y)=>x-y);
      const mad = dev[Math.floor(dev.length/2)] || 1e-6;
      const k = 6;
      return [med - k*mad, med + k*mad];
    }
    const inView = (arr)=> arr.filter((_,i)=> xs[i] >= minX && xs[i] <= maxX);
    const [r1min,r1max] = robustRange(inView(d1).length? inView(d1) : d1);
    const [r2min,r2max] = robustRange(inView(d2).length? inView(d2) : d2);
    const minY = Math.min(0, r1min, r2min);
    const maxY = Math.max(0, r1max, r2max);

    const pad = 28;
    const x2px = x => pad + (W-2*pad) * (x - minX) / Math.max(1e-6, (maxX - minX));
    const y2px = y => H - (pad + (H-2*pad) * (y - minY) / Math.max(1e-6, (maxY - minY)));

    // Δv（蓝）
    ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 2; ctx.beginPath();
    xs.forEach((t,i)=>{ if (t<minX || t>maxX) return; const x = x2px(t), y = y2px(d1[i]); const prev = i>0 && xs[i-1]>=minX; (prev?ctx.lineTo(x,y):ctx.moveTo(x,y)); });
    ctx.stroke();

    // d(Δv)（橙）
    ctx.strokeStyle = '#f97316'; ctx.lineWidth = 1.5; ctx.beginPath();
    xs.forEach((t,i)=>{ if (t<minX || t>maxX) return; const x = x2px(t), y = y2px(d2[i]); const prev = i>0 && xs[i-1]>=minX; (prev?ctx.lineTo(x,y):ctx.moveTo(x,y)); });
    ctx.stroke();

    // 坐标含义说明
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#93c5fd';
    ctx.fillText('蓝: Δv  X=时间(s)  Y=灰度均值差', pad, 14);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('橙: d(Δv)  X=时间(s)  Y=差值变化', pad, 28);

    // 当前时间指示线
    if (!isNaN(video.currentTime)){
      const ct = video.currentTime;
      if (ct>=minX && ct<=maxX){ ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 1; const x = x2px(ct); ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, H-pad); ctx.stroke(); }
    }
  }

  function labelFor(type){
    if (type==='sudden') return '突增'; if (type==='threshold') return '阈值'; if (type==='relative') return '相对'; return type;
  }

  function renderTimeline(){
    const ctx = timeline.getContext('2d');
    const W = timeline.clientWidth || timeline.width; timeline.width = W; const H = timeline.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#111827'; ctx.fillRect(0,0,W,H);
    if (timelineState.fullMax <= timelineState.fullMin) return;
    const minX = timelineState.min, maxX = timelineState.max;
    const x2px = x => (W) * (x - minX) / Math.max(1e-6, (maxX - minX));
    // 不绘制时间刻度数字与基线，仅保留事件柱与当前时间线
    // events as colored ticks in view
    // shaded segments for d(Δv) between rise/fall thresholds
    ctx.fillStyle = 'rgba(251,191,36,0.28)';
    (shadedIntervals||[]).forEach(seg=>{
      if (!seg) return; const s = Math.max(minX, seg.start), e = Math.min(maxX, seg.end); if (e <= s) return;
      const x1 = x2px(s), x2 = x2px(e); ctx.fillRect(x1, 4, Math.max(1, x2-x1), H-8);
    });
    // current time indicator
    if (!isNaN(video.currentTime)){
      const ct = video.currentTime;
      if (ct>=minX && ct<=maxX){ ctx.fillStyle = '#60a5fa'; const x = x2px(ct); ctx.fillRect(x-1, 2, 2, H-4); }
    }

    // peak markers
    ctx.fillStyle = '#10b981'; // Green color for peaks
    (detectedPeaks||[]).forEach(peak => {
      if (peak.time >= minX && peak.time <= maxX) {
        const x = x2px(peak.time);
        // Draw triangle pointing up
        ctx.beginPath();
        ctx.moveTo(x, H/2 + 4); // Bottom point of triangle
        ctx.lineTo(x - 3, H/2 - 4); // Left point
        ctx.lineTo(x + 3, H/2 - 4); // Right point
        ctx.closePath();
        ctx.fill();
      }
    });

    // 不绘制左右角时间文本
  }

  // compute max of blue (d1) within shaded intervals and update indicator
  function updateBlueJudge(){
    const indicator = document.getElementById('blueJudge');
    if (!indicator){ return; }
    if (!analyzedSeries || !analyzedSeries.length || !analyzedXs || !analyzedXs.length || !shadedIntervals || !shadedIntervals.length){
      indicator.textContent = 'X'; indicator.classList.remove('ok'); return;
    }
    const xs = analyzedXs;
    const v = analyzedSeries.map(p=>p.roi);
    // d1: current - historical mean
    let acc=0; const d1=new Array(v.length).fill(0);
    for(let i=0;i<v.length;i++){ if(i===0){ d1[i]=0; acc+=v[i]; continue; } const prevMean = acc / i; d1[i]=v[i]-prevMean; acc+=v[i]; }
    let maxVal = -Infinity;
    for(let i=0;i<xs.length;i++){
      const t = xs[i];
      const inside = shadedIntervals.some(seg => t>=seg.start && t<=seg.end);
      if (inside){ if (isFinite(d1[i])) maxVal = Math.max(maxVal, d1[i]); }
    }
    const thr = Number((blueMaxThreshEl && blueMaxThreshEl.value) || 35);
    const pass = isFinite(maxVal) && (maxVal > thr);
    indicator.textContent = pass ? 'Y' : 'X';
    indicator.classList.toggle('ok', !!pass);
    lastBlueJudge = { maxVal, thr, pass };
  }

  // timeline interactions: click/scrub to seek, wheel to zoom, CTRL+drag to pan
  function clampRange(min, max){
    const fmin = timelineState.fullMin, fmax = timelineState.fullMax;
    const span = max - min; if (span <= 0) return [fmin, fmax];
    if (min < fmin){ max += (fmin - min); min = fmin; }
    if (max > fmax){ min -= (max - fmax); max = fmax; }
    min = Math.max(fmin, min); max = Math.min(fmax, max);
    // don't allow too small window (e.g., 0.5s)
    if (max - min < 0.5){ const c = (min+max)/2; min = c - 0.25; max = c + 0.25; }
    return [min, max];
  }
  function rerenderAll(){
    if (analyzedSeries && analyzedSeries.length){
      renderChart(analyzedXs, analyzedSeries, analyzedBaseline, analyzedEvents);
    }
  }
  timeline.addEventListener('click', (e)=>{
    const rect = timeline.getBoundingClientRect(); const x = e.clientX - rect.left; const W = rect.width;
    const t = timelineState.min + (x / Math.max(1, W)) * (timelineState.max - timelineState.min);
    if (isFinite(t) && !isNaN(t)){
      video.currentTime = t;
      renderTimeline();
      rerenderAll();

      // Update information panel with curve values
      const values = interpolateCurveValues(t);
      updateInfoPanel(t, values);

      // Update next interval info
      updateNextIntervalInfo(t);
    }
  });
  timeline.addEventListener('wheel', (e)=>{
    if (timelineState.fullMax <= timelineState.fullMin) return;
    e.preventDefault();
    const rect = timeline.getBoundingClientRect(); const x = e.clientX - rect.left; const W = rect.width;
    const frac = x / Math.max(1, W);
    const view = timelineState.max - timelineState.min;
    const center = timelineState.min + frac * view;
    const factor = e.deltaY > 0 ? 1.2 : (1/1.2);
    let newView = Math.min(timelineState.fullMax - timelineState.fullMin, Math.max(0.5, view * factor));
    let min = center - frac * newView; let max = min + newView;
    [timelineState.min, timelineState.max] = clampRange(min, max);
    renderTimeline(); rerenderAll();
  }, { passive:false });
  let drag = { active:false, mode:'scrub', lastX:0 };
  timeline.addEventListener('mousedown', (e)=>{ drag.active = true; drag.mode = e.ctrlKey ? 'pan' : 'scrub'; drag.lastX = e.clientX; if (drag.mode==='scrub') timeline.dispatchEvent(new MouseEvent('mousemove', e)); });
  window.addEventListener('mouseup', ()=>{ drag.active = false; });
  window.addEventListener('mousemove', (e)=>{
    if (!drag.active) return;
    const rect = timeline.getBoundingClientRect();
    if (drag.mode === 'pan'){
      const dx = e.clientX - drag.lastX; drag.lastX = e.clientX;
      const W = rect.width; const view = timelineState.max - timelineState.min;
      const dt = - dx / Math.max(1, W) * view;
      let min = timelineState.min + dt; let max = timelineState.max + dt;
      [timelineState.min, timelineState.max] = clampRange(min, max);
      renderTimeline(); rerenderAll();
    } else {
      const x = e.clientX - rect.left; const W = rect.width;
      const t = timelineState.min + (x / Math.max(1, W)) * (timelineState.max - timelineState.min);
      if (isFinite(t) && !isNaN(t)){ video.currentTime = clamp(t, timelineState.fullMin, timelineState.fullMax); renderTimeline(); rerenderAll(); }
    }
  });

  // keep timeline current-time indicator in sync
  video.addEventListener('timeupdate', ()=>{
    renderTimeline();
    rerenderAll();

    // Update information panel during playback
    if (video.currentTime && analyzedXs.length > 0) {
      const values = interpolateCurveValues(video.currentTime);
      updateInfoPanel(video.currentTime, values);
    }
  });
  // keep chart/timeline in sync on window resize
  window.addEventListener('resize', ()=>{ renderTimeline(); rerenderAll(); });
  // re-compute shaded intervals when thresholds change
  function onThresholdsChange(){ if (!analyzedSeries || !analyzedSeries.length) return; recomputeShadedIntervals(); renderTimeline(); }
  p.rise_thresh?.addEventListener('input', onThresholdsChange);
  p.fall_thresh?.addEventListener('input', onThresholdsChange);

  // i18n fix for garbled labels using Unicode escapes (safe under any file encoding)
  try {
    const t = document.getElementById('shade_title'); if (t) t.textContent = 'Timeline Shading';
    const rl = document.getElementById('rise_label'); if (rl) rl.textContent = 'Rise Threshold (+)';
    const fl = document.getElementById('fall_label'); if (fl) fl.textContent = 'Fall Threshold (-)';
    // removed mode/extra labels; keep only title and two thresholds

    // generic helpers
    const setText = (sel, text) => { const el = document.querySelector(sel); if (el) el.textContent = text; };
    const setLabelTextForInput = (inputId, text) => {
      const input = document.getElementById(inputId);
      if (!input) return;
      const label = input.closest('label');
      if (!label) return;
      let span = label.querySelector('span.txt');
      if (!span){ span = document.createElement('span'); span.className = 'txt'; label.appendChild(span); }
      span.textContent = ' ' + text;
    };

    // fix panel headers and hints
    setText('.panel.video-panel .panel-header', '\u89C6\u9891\u4E0E ROI');
    const resPanelHeader = document.querySelector('.panel-header');
    if (resPanelHeader) resPanelHeader.textContent = 'Analysis';
    setText('.hint', 'Select ROI: left-drag; middle pan; right toggle ROI');

    // curve toggle labels
    setLabelTextForInput('showBlue', 'Blue \\u0394v');
    setLabelTextForInput('showYellow', 'Yellow d(\\u0394v)');
    setLabelTextForInput('showWhiteRoi', 'White ROI Avg');
  } catch (_) {}
  // zoom video with mouse wheel over video box
  document.querySelector('.video-box').addEventListener('wheel', (e)=>{
    // avoid interfering when user is over a scrollable element that is not videoWrap area
    if (!videoWrap.contains(e.target) && e.target !== videoWrap) return;
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1/1.1 : 1.1;
    const newZoom = clamp(zoom * factor, 0.5, 3.0);
    if (Math.abs(newZoom - zoom) > 1e-3){ zoom = newZoom; resizeOverlay(); }
  }, { passive:false });

  // Wheel to zoom Y-range when over Y-axis area of the chart
  chart.addEventListener('wheel', (e)=>{
    const rect = chart.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const axisHit = x <= (chartState.padLeft || 56) + 12; // near left axis
    if (!axisHit) return;
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1/1.2 : 1.2; // wheel up -> zoom in
    chartState.yZoom = clamp((chartState.yZoom || 1) * factor, 0.1, 20);
    rerenderAll();
  }, { passive:false });

    // ===== Enhanced chart with toggles and labeled Y axis =====
  function drawYAxis(ctx, W, H, padLeft, padRight, padTop, padBottom, minY, maxY, y2px){
    const ticks = niceTicks(minY, maxY, 5);
    ctx.save();
    // grid
    ctx.strokeStyle = '#2b2f36'; ctx.lineWidth = 1; ctx.setLineDash([3,6]);
    ticks.forEach(t=>{ const y = y2px(t); ctx.beginPath(); ctx.moveTo(padLeft, y); ctx.lineTo(W-padRight, y); ctx.stroke(); });
    ctx.restore();
    // axis line
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(padLeft, padTop); ctx.lineTo(padLeft, H-padBottom); ctx.stroke();
    // labels
    ctx.fillStyle = '#9da0a6'; ctx.font = '12px sans-serif';
    ticks.forEach(t=>{ const y = y2px(t); ctx.fillText(fmtNum(t), 4, y+4); });
  }

  function niceTicks(min, max, count){
    if (!isFinite(min) || !isFinite(max) || min===max){ min = (min||-1); max = (max||1); if (min===max){ min-=1; max+=1; } }
    const span = max - min; const step0 = span / Math.max(1, count);
    const mag = Math.pow(10, Math.floor(Math.log10(Math.max(1e-12, step0))));
    const norm = step0 / mag; let step;
    if (norm >= 5) step = 10*mag; else if (norm >= 2) step = 5*mag; else if (norm >= 1) step = 2*mag; else step = mag;
    const start = Math.ceil(min / step) * step; const end = Math.floor(max / step) * step;
    const ticks = []; for (let v=start; v<=end+1e-9; v+=step){ ticks.push(Number(v.toFixed(6))); }
    if (!ticks.length){ ticks.push(min, max); }
    return ticks;
  }

  function fmtNum(v){
    const av = Math.abs(v);
    if (av >= 100) return v.toFixed(0);
    if (av >= 10) return v.toFixed(1);
    return v.toFixed(2);
  }

  // Override previous renderChart with a version that supports toggles and Y-axis labels
  function renderChart(xs, series, baseline, events){
    const ctx = chart.getContext('2d');
    const targetW = (timeline.clientWidth || timeline.width || chart.clientWidth || chart.width || 600);
    chart.width = targetW; chart.style.width = targetW + 'px';
    const W = targetW; const H = chart.height; ctx.clearRect(0,0,W,H);
    if (!series || !series.length){ return; }

    // data
    const v = series.map(p=>p.roi);
    // 蓝线：当前帧ROI均值 - 之前所有帧ROI均值的平均
    const d1 = new Array(v.length).fill(0);
    let acc = 0;
    for (let i=0;i<v.length;i++){
      if (i === 0){ d1[i] = 0; acc += v[i]; continue; }
      const prevMean = acc / i; // mean of v[0..i-1]
      d1[i] = v[i] - prevMean;
      acc += v[i];
    }
    // 黄线：蓝线的一阶差分，反映蓝线变化
    const d2 = d1.map((_,i)=> i>0 ? (d1[i]-d1[i-1]) : 0);
    // 粉线：ROI内像素标准差
    const stdSeries = series.map(p=>p.std);
    // 紫线：ROI内高灰度像素占比
    const highSeries = series.map(p=>p.high);
    // 橙线：条件像素占比（当平均像素值 > 阈值1时，ROI内超过阈值2的像素数占ROI总像素数的比例）
    const orangeSeries = series.map(p=>p.orange || 0);

    // window sync to timeline
    let minX = xs[0], maxX = xs[xs.length-1];
    if (timelineState && (timelineState.max - timelineState.min) > 0){
      minX = Math.max(minX, timelineState.min || minX);
      maxX = Math.min(maxX, timelineState.max || maxX);
      if (maxX <= minX){ minX = xs[0]; maxX = xs[xs.length-1]; }
    }

    // y-range from selected curves
    const inView = (arr)=> arr.filter((_,i)=> xs[i] >= minX && xs[i] <= maxX);
    const parts = [];
    if (chartState.showBlue) parts.push(inView(d1).length? inView(d1):d1);
    if (chartState.showYellow) parts.push(inView(d2).length? inView(d2):d2);
    if (chartState.showWhiteRoi) parts.push(inView(v).length? inView(v):v);
    if (chartState.showPinkStd) parts.push(inView(stdSeries).length? inView(stdSeries):stdSeries);
    if (chartState.showPurpleHigh) parts.push(inView(highSeries).length? inView(highSeries):highSeries);
    if (chartState.showOrange) parts.push(inView(orangeSeries).length? inView(orangeSeries):orangeSeries);
    if (!parts.length){
      // nothing selected, just draw axis baseline
      const padLeft = 56, padRight = 10, padTop = 16, padBottom = 22;
      const y2px = y=> H - (padBottom + (H-padTop-padBottom) * (y - (-1)) / Math.max(1e-6, (1 - (-1))));
      drawYAxis(ctx, W, H, padLeft, padRight, padTop, padBottom, -1, 1, y2px);
      return;
    }
    // 纵轴基础范围：直接采用所选曲线在当前视窗内的最小值与最大值
    const vals = ([]).concat(...parts).filter(Number.isFinite);
    let baseMinY = Math.min.apply(null, vals);
    let baseMaxY = Math.max.apply(null, vals);
    if (!isFinite(baseMinY) || !isFinite(baseMaxY)) { baseMinY = -1; baseMaxY = 1; }
    if (baseMaxY - baseMinY < 1e-6) { const c = (baseMinY+baseMaxY)/2; baseMinY = c-1; baseMaxY = c+1; }
    const baseCenter = (baseMinY + baseMaxY) / 2;
    const baseHalf = (baseMaxY - baseMinY) / 2 || 1;
    const zoom = Math.max(0.1, Math.min(20, chartState.yZoom || 1));
    const minY = baseCenter - baseHalf / zoom;
    const maxY = baseCenter + baseHalf / zoom;

    const padLeft = chartState.padLeft || 56, padRight = 10, padTop = 16, padBottom = 22;
    const x2px = x => padLeft + (W-padLeft-padRight) * (x - minX) / Math.max(1e-6, (maxX - minX));
    const y2px = y => H - (padBottom + (H-padTop-padBottom) * (y - minY) / Math.max(1e-6, (maxY - minY)));

    drawYAxis(ctx, W, H, padLeft, padRight, padTop, padBottom, minY, maxY, y2px);

    if (chartState.showBlue){
      ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 2; ctx.beginPath();
      xs.forEach((t,i)=>{ if (t<minX || t>maxX) return; const x=x2px(t), y=y2px(d1[i]); const prev=i>0 && xs[i-1]>=minX; (prev?ctx.lineTo(x,y):ctx.moveTo(x,y)); });
      ctx.stroke();
    }
    if (chartState.showYellow){
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.5; ctx.beginPath();
      xs.forEach((t,i)=>{ if (t<minX || t>maxX) return; const x=x2px(t), y=y2px(d2[i]); const prev=i>0 && xs[i-1]>=minX; (prev?ctx.lineTo(x,y):ctx.moveTo(x,y)); });
      ctx.stroke();
    }
    if (chartState.showWhiteRoi){
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 2;
      ctx.beginPath();
      xs.forEach((t,i)=>{
        if (t<minX || t>maxX) return;
        const x=x2px(t), y=y2px(v[i]);
        const prev=i>0 && xs[i-1]>=minX;
        (prev?ctx.lineTo(x,y):ctx.moveTo(x,y));
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    if (chartState.showPinkStd){
      ctx.strokeStyle = '#f9a8d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      xs.forEach((t,i)=>{
        if (t<minX || t>maxX) return;
        const x=x2px(t), y=y2px(stdSeries[i]);
        const prev=i>0 && xs[i-1]>=minX;
        (prev?ctx.lineTo(x,y):ctx.moveTo(x,y));
      });
      ctx.stroke();
    }
    if (chartState.showPurpleHigh){
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      xs.forEach((t,i)=>{
        if (t<minX || t>maxX) return;
        const x=x2px(t), y=y2px(highSeries[i]);
        const prev=i>0 && xs[i-1]>=minX;
        (prev?ctx.lineTo(x,y):ctx.moveTo(x,y));
      });
      ctx.stroke();
    }
    if (chartState.showOrange){
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      xs.forEach((t,i)=>{
        if (t<minX || t>maxX) return;
        const x=x2px(t), y=y2px(orangeSeries[i]);
        const prev=i>0 && xs[i-1]>=minX;
        (prev?ctx.lineTo(x,y):ctx.moveTo(x,y));
      });
      ctx.stroke();
    }

    // labels for meaning
    let tx = padLeft + 4; let ty = padTop - 2; ty = Math.max(14, ty);
    ctx.font = '12px sans-serif';
    if (chartState.showBlue){ ctx.fillStyle = '#93c5fd'; ctx.fillText('蓝: 当前帧ROI均值 − 历史均值  X=时间(s)  Y=差值', tx, 14); }
    if (chartState.showYellow){ ctx.fillStyle = '#fbbf24'; ctx.fillText('黄: 上述差值的一阶差分  X=时间(s)  Y=变化量', tx, 28); }
    if (chartState.showWhiteRoi){ ctx.fillStyle = '#ffffff'; ctx.fillText('白: ROI平均灰度值  X=时间(s)  Y=灰度', tx, 42); }
    if (chartState.showPinkStd){ ctx.fillStyle = '#f9a8d4'; ctx.fillText('粉: ROI内像素标准差  X=时间(s)  Y=标准差', tx, 56); }
    if (chartState.showPurpleHigh){ ctx.fillStyle = '#a855f7'; ctx.fillText('紫: ROI内高灰度像素占比  X=时间(s)  Y=百分比', tx, 70); }
    if (chartState.showOrange){ ctx.fillStyle = '#fb923c'; ctx.fillText('橙: 条件像素占比  X=时间(s)  Y=百分比', tx, 84); }

    // current time line
    if (!isNaN(video.currentTime)){
      const ct = video.currentTime; if (ct>=minX && ct<=maxX){ const x=x2px(ct); ctx.strokeStyle='#60a5fa'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x, padTop); ctx.lineTo(x, H-padBottom); ctx.stroke(); }
    }

    // expose padLeft for wheel hit-test
    chartState.padLeft = padLeft;
  }

  // Information panel functions
  function interpolateCurveValues(timestamp) {
    if (!analyzedXs.length || !analyzedSeries.length) {
      return { timestamp, blue: null, yellow: null, white: null, pink: null, purple: null, orange: null, status: '无分析数据' };
    }

    // Find the closest indices in analyzedXs array
    let leftIdx = 0;
    let rightIdx = analyzedXs.length - 1;

    for (let i = 0; i < analyzedXs.length - 1; i++) {
      if (analyzedXs[i] <= timestamp && analyzedXs[i + 1] >= timestamp) {
        leftIdx = i;
        rightIdx = i + 1;
        break;
      }
      if (analyzedXs[i] > timestamp) {
        rightIdx = i;
        leftIdx = Math.max(0, i - 1);
        break;
      }
    }

    // Get the data points
    const leftTime = analyzedXs[leftIdx];
    const rightTime = analyzedXs[rightIdx];
    const leftData = analyzedSeries[leftIdx];
    const rightData = analyzedSeries[rightIdx];

    // Calculate curve values at data points
    const leftWhite = leftData.roi;
    const rightWhite = rightData.roi;
    const leftPink = leftData.std;
    const rightPink = rightData.std;
    const leftPurple = leftData.high;
    const rightPurple = rightData.high;
    const leftOrange = leftData.orange || 0;
    const rightOrange = rightData.orange || 0;

    // Recalculate blue and yellow values for this specific data
    const v = analyzedSeries.map(p => p.roi);
    const d1 = new Array(v.length).fill(0);
    let acc = 0;
    for (let i = 0; i < v.length; i++) {
      if (i === 0) { d1[i] = 0; acc += v[i]; continue; }
      const prevMean = acc / i;
      d1[i] = v[i] - prevMean;
      acc += v[i];
    }
    const d2 = d1.map((_, i) => i > 0 ? (d1[i] - d1[i - 1]) : 0);
    const std = analyzedSeries.map(p => p.std);
    const high = analyzedSeries.map(p => p.high);

    const leftBlue = d1[leftIdx];
    const rightBlue = d1[rightIdx];
    const leftYellow = d2[leftIdx];
    const rightYellow = d2[rightIdx];

    // Perform linear interpolation
    let blue, yellow, white, pink, purple, orange, status;

    if (Math.abs(rightTime - leftTime) < 1e-6) {
      // Exact match or very close points
      blue = leftBlue;
      yellow = leftYellow;
      white = leftWhite;
      pink = leftPink;
      purple = leftPurple;
      orange = leftOrange;
      status = '精确值';
    } else if (timestamp <= analyzedXs[0]) {
      // Before first data point - use first value
      blue = d1[0];
      yellow = d2[0];
      white = v[0];
      pink = std[0];
      purple = high[0];
      orange = (series[0] && series[0].orange) || 0;
      status = '外推值(前)';
    } else if (timestamp >= analyzedXs[analyzedXs.length - 1]) {
      // After last data point - use last value
      blue = d1[d1.length - 1];
      yellow = d2[d2.length - 1];
      white = v[v.length - 1];
      pink = std[std.length - 1];
      purple = high[high.length - 1];
      orange = (series[series.length - 1] && series[series.length - 1].orange) || 0;
      status = '外推值(后)';
    } else {
      // Linear interpolation between points
      const ratio = (timestamp - leftTime) / (rightTime - leftTime);
      blue = leftBlue + (rightBlue - leftBlue) * ratio;
      yellow = leftYellow + (rightYellow - leftYellow) * ratio;
      white = leftWhite + (rightWhite - leftWhite) * ratio;
      pink = leftPink + (rightPink - leftPink) * ratio;
      purple = leftPurple + (rightPurple - leftPurple) * ratio;
      orange = leftOrange + (rightOrange - leftOrange) * ratio;
      status = '插值';
    }

    return { timestamp, blue, yellow, white, pink, purple, orange, status };
  }

  function updateInfoPanel(timestamp, values) {
    if (!infoTimestampEl || !infoBlueValueEl || !infoYellowValueEl || !infoWhiteValueEl || !infoPinkValueEl || !infoPurpleValueEl || !infoOrangeValueEl || !infoStatusEl) return;

    // Update timestamp display
    infoTimestampEl.textContent = timestamp.toFixed(3) + 's';

    // Update curve values with formatting
    infoBlueValueEl.textContent = values.blue !== null ? values.blue.toFixed(3) : '--';
    infoYellowValueEl.textContent = values.yellow !== null ? values.yellow.toFixed(3) : '--';
    infoWhiteValueEl.textContent = values.white !== null ? values.white.toFixed(1) : '--';
    infoPinkValueEl.textContent = values.pink !== null ? values.pink.toFixed(3) : '--';
    infoPurpleValueEl.textContent = values.purple !== null ? values.purple.toFixed(1) : '--';
    infoOrangeValueEl.textContent = values.orange !== null ? values.orange.toFixed(1) : '--';

    // Update status
    infoStatusEl.textContent = values.status || '就绪';

    // Add active highlighting
    const infoPanel = document.querySelector('.info-panel');
    if (values.blue !== null) {
      infoPanel.style.borderColor = '#4fc3f7';
      infoPanel.style.boxShadow = '0 0 8px rgba(79, 195, 247, 0.3)';
    } else {
      infoPanel.style.borderColor = 'var(--border)';
      infoPanel.style.boxShadow = 'none';
    }
  }

  function clearInfoPanel() {
    if (!infoTimestampEl || !infoBlueValueEl || !infoYellowValueEl || !infoWhiteValueEl || !infoPinkValueEl || !infoPurpleValueEl || !infoStatusEl) return;

    infoTimestampEl.textContent = '--';
    infoBlueValueEl.textContent = '--';
    infoYellowValueEl.textContent = '--';
    infoWhiteValueEl.textContent = '--';
    infoPinkValueEl.textContent = '--';
    infoPurpleValueEl.textContent = '--';
    infoStatusEl.textContent = '点击时间轴查看曲线值';

    const infoPanel = document.querySelector('.info-panel');
    infoPanel.style.borderColor = 'var(--border)';
    infoPanel.style.boxShadow = 'none';
  }

  // toggles
  function syncToggles(){
    chartState.showBlue = showBlueEl ? showBlueEl.checked : true;
    chartState.showYellow = showYellowEl ? showYellowEl.checked : true;
    chartState.showWhiteRoi = showWhiteRoiEl ? showWhiteRoiEl.checked : true;
    chartState.showPinkStd = showPinkStdEl ? showPinkStdEl.checked : true;
    chartState.showPurpleHigh = showPurpleHighEl ? showPurpleHighEl.checked : true;
    chartState.showOrange = showOrangeEl ? showOrangeEl.checked : true;
    rerenderAll();
  }
  if (showBlueEl) {
    showBlueEl.addEventListener('change', syncToggles);
  }
  if (showYellowEl) {
    showYellowEl.addEventListener('change', syncToggles);
  }
  if (showWhiteRoiEl) {
    showWhiteRoiEl.addEventListener('change', syncToggles);
  }
  if (showPinkStdEl) {
    showPinkStdEl.addEventListener('change', syncToggles);
  }
  if (showPurpleHighEl) {
    showPurpleHighEl.addEventListener('change', syncToggles);
  }
  if (showOrangeEl) {
    showOrangeEl.addEventListener('change', syncToggles);
  }

  // Clear information panel button
  if (clearInfoBtn) {
    clearInfoBtn.addEventListener('click', clearInfoPanel);
  }

  // Next interval panel event listeners
  if (findNextIntervalBtn) {
    findNextIntervalBtn.addEventListener('click', () => {
      const currentTime = video.currentTime || 0;
      updateNextIntervalInfo(currentTime);
    });
  }

  if (jumpToIntervalBtn) {
    jumpToIntervalBtn.addEventListener('click', () => {
      if (window.currentNextInterval) {
        jumpToInterval(window.currentNextInterval);
      }
    });
  }

  if (jumpToIntervalEndBtn) {
    jumpToIntervalEndBtn.addEventListener('click', () => {
      if (window.currentNextInterval) {
        jumpToIntervalEnd(window.currentNextInterval);
      }
    });
  }

  if (prevFrameBtn) {
    prevFrameBtn.addEventListener('click', () => {
      navigateToPreviousFrame(window.currentNextInterval);
    });
  }

  if (nextFrameBtn) {
    nextFrameBtn.addEventListener('click', () => {
      navigateToNextFrame(window.currentNextInterval);
    });
  }

  // Update interval info when video time changes
  if (video) {
    video.addEventListener('timeupdate', () => {
      const currentTime = video.currentTime || 0;
      updateNextIntervalInfo(currentTime);
    });
  }






















// Deep analysis functions
  async function performBatchDeepAnalysis() {
    if (batchFiles.length === 0) {
      alert('请先加载视频文件');
      return;
    }

    // Check if ROI is set (use current video's ROI or default)
    if (!roi) {
      if (!confirm('尚未设置ROI，是否使用默认的中心50%区域进行深度分析？')) {
        return;
      }
      // Set default ROI if not confirmed
      roi = { x: 0.25, y: 0.25, w: 0.5, h: 0.5 };
    }

    deepAnalysisResults.clear();
    deepAnalysisProcessing = true;

    // Show deep analysis progress
    showDeepAnalysisProgress(true, 0, '开始深度分析...');

    try {
      for (let i = 0; i < batchFiles.length; i++) {
        if (!deepAnalysisProcessing) break; // Check if cancelled

        const file = batchFiles[i];
        const progress = ((i + 1) / batchFiles.length * 100).toFixed(0);
        showDeepAnalysisProgress(true, progress, `正在分析 ${i + 1}/${batchFiles.length}: ${file.name}`);

        try {
          // Deep analyze single video
          const deepResult = await deepAnalyzeSingleVideo(file);
          if (deepResult) {
            deepAnalysisResults.set(deepResult.videoId, deepResult);
            console.log(`深度分析完成 ${file.name}, 结果数量: ${deepAnalysisResults.size}`);
          }
        } catch (error) {
          console.error(`深度分析失败 ${file.name}:`, error);
          showDeepAnalysisProgress(true, progress, `分析失败 ${file.name}: ${error.message}`);
        }
      }

      if (deepAnalysisProcessing) {
        showDeepAnalysisProgress(true, 100, '深度分析完成，准备导出CSV...');
        setTimeout(() => {
          exportDeepAnalysisToCSV();
          showDeepAnalysisProgress(false);
          // Enable export controls after deep analysis
          enableExportControls();
        }, 1000);
      }

    } catch (error) {
      console.error('批量深度分析失败:', error);
      alert('批量深度分析失败: ' + error.message);
    } finally {
      deepAnalysisProcessing = false;
    }
  }

  async function deepAnalyzeSingleVideo(file) {
    const videoId = file.name + '_' + file.size;

    try {
      // Use current ROI or default ROI for analysis
      const analysisRoi = roi || { x: 0.25, y: 0.25, w: 0.5, h: 0.5 };

      // Prepare form data for backend analysis
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roi_x', String(analysisRoi.x));
      formData.append('roi_y', String(analysisRoi.y));
      formData.append('roi_w', String(analysisRoi.w));
      formData.append('roi_h', String(analysisRoi.h));
      formData.append('sample_fps', String(Number(sampleFpsEl?.value || 8)));
      formData.append('methods', 'sudden,threshold,relative');

      // Add parameters
      Object.entries(p).forEach(([key, el]) => {
        if (el) {
          let value = el.value;
          // Ensure default values for critical parameters
          if (key === 'conditional_threshold1' && (value === '' || value === undefined)) value = '120';
          if (key === 'conditional_threshold2' && (value === '' || value === undefined)) value = '160';
          if (key === 'high_threshold' && (value === '' || value === undefined)) value = '130';
          formData.append(key, String(value));
        }
      });

      // Debug: Log deep analysis parameters
      console.log('📤 Sending deep analysis parameters:', {
        conditional_threshold1: p.conditional_threshold1?.value || '120',
        conditional_threshold2: p.conditional_threshold2?.value || '160',
        high_threshold: p.high_threshold?.value || '130'
      });

      // Send to backend for analysis
      const response = await fetch('http://localhost:8421/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const analysisResult = await response.json();

      if (!analysisResult || !analysisResult.series || analysisResult.series.length === 0) {
        throw new Error('分析结果无效');
      }

      // Temporarily store analysis data for interval finding
      const originalAnalyzedXs = analyzedXs;
      const originalAnalyzedSeries = analyzedSeries;
      const originalShadedIntervals = shadedIntervals;
      const originalAnalyzedBaseline = analyzedBaseline;

      analyzedXs = analysisResult.series.map(p => p.t);
      analyzedSeries = analysisResult.series;
      analyzedBaseline = analysisResult.baseline || 0;

      // Recompute shaded intervals based on the analysis
      recomputeShadedIntervals();

      // Find the first shaded interval (from time 0)
      const firstInterval = findNextShadedInterval(0);

      let deepStats = null;

      if (firstInterval) {
        // Calculate statistics for this interval
        const statistics = calculateIntervalStatistics(firstInterval);

        if (statistics) {
          deepStats = {
            videoName: file.name,
            videoId: videoId,
            file: file,
            interval: firstInterval,
            statistics: {
              blue: {
                avg: statistics.blue.avg,
                max: statistics.blue.max,
                min: statistics.blue.min
              },
              yellow: {
                avg: statistics.yellow.avg,
                max: statistics.yellow.max,
                min: statistics.yellow.min
              },
              white: {
                avg: statistics.white.avg,
                max: statistics.white.max,
                min: statistics.white.min
              },
              pink: {
                avg: statistics.pink.avg,
                max: statistics.pink.max,
                min: statistics.pink.min
              },
              purple: {
                avg: statistics.purple.avg,
                max: statistics.purple.max,
                min: statistics.purple.min
              }
            }
          };
          console.log(`成功找到区间并计算统计: ${file.name}, 区间: [${firstInterval.start.toFixed(2)}, ${firstInterval.end.toFixed(2)}]`);
        }
      } else {
        // No interval found - still return basic info
        deepStats = {
          videoName: file.name,
          videoId: videoId,
          file: file,
          interval: null,
          statistics: null
        };
        console.log(`未找到着色区间: ${file.name}`);
      }

      // Restore original analysis data
      analyzedXs = originalAnalyzedXs;
      analyzedSeries = originalAnalyzedSeries;
      shadedIntervals = originalShadedIntervals;
      analyzedBaseline = originalAnalyzedBaseline;

      // Also store complete analysis data in batchAnalyses for export functionality
      const analysisData = {
        id: videoId,
        fileName: file.name,
        file: file,
        roi: analysisRoi,
        results: {
          has_hem: !!firstInterval,
          series: analysisResult.series,
          baseline: analysisResult.baseline || 0,
          events: analysisResult.events || []
        },
        status: 'completed',
        progress: 100
      };

      // Add to batch analyses map for export functionality
      batchAnalyses.set(videoId, analysisData);
      console.log(`✅ 已将完整分析数据存储到 batchAnalyses: ${videoId}`);

      return deepStats;

    } catch (error) {
      console.error('深度分析单个视频失败:', error);
      throw error;
    }
  }

  function exportDeepAnalysisToCSV() {
    console.log(`开始导出深度分析，结果数量: ${deepAnalysisResults.size}`);

    if (deepAnalysisResults.size === 0) {
      alert('没有深度分析数据可导出');
      return;
    }

    // Create CSV content
    let csvContent = '文件名,区间开始时间,区间结束时间,蓝_平均值,蓝_最大值,蓝_最小值,黄_平均值,黄_最大值,黄_最小值,白_平均值,白_最大值,白_最小值,粉_平均值,粉_最大值,粉_最小值,紫_平均值,紫_最大值,紫_最小值\n';

    const results = Array.from(deepAnalysisResults.values());
    console.log(`准备导出 ${results.length} 个结果:`, results.map(r => r.videoName));

    let exportedCount = 0;
    results.forEach(result => {
      if (result.interval && result.statistics) {
        const row = [
          result.videoName,
          result.interval.start.toFixed(3),
          result.interval.end.toFixed(3),
          result.statistics.blue.avg.toFixed(3),
          result.statistics.blue.max.toFixed(3),
          result.statistics.blue.min.toFixed(3),
          result.statistics.yellow.avg.toFixed(3),
          result.statistics.yellow.max.toFixed(3),
          result.statistics.yellow.min.toFixed(3),
          result.statistics.white.avg.toFixed(1),
          result.statistics.white.max.toFixed(1),
          result.statistics.white.min.toFixed(1),
          result.statistics.pink.avg.toFixed(3),
          result.statistics.pink.max.toFixed(3),
          result.statistics.pink.min.toFixed(3),
          result.statistics.purple.avg.toFixed(1),
          result.statistics.purple.max.toFixed(1),
          result.statistics.purple.min.toFixed(1)
        ];
        csvContent += row.join(',') + '\n';
        exportedCount++;
      } else {
        // Handle files without valid intervals
        console.log(`跳过无效结果: ${result.videoName}`);
        const row = [
          result.videoName,
          '无区间',
          '无区间',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'N/A'
        ];
        csvContent += row.join(',') + '\n';
        exportedCount++;
      }
    });

    console.log(`实际导出 ${exportedCount} 条记录`);

    // Create and download CSV file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `深度分析结果_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`深度分析完成！已导出 ${exportedCount} 个文件的分析结果到CSV文件（包含${results.length - exportedCount}个无区间文件）。`);
  }

  // Export curve data for all analyzed videos
  function exportCurveDataToFiles() {
    console.log('🔍 开始导出曲线数据...');
    console.log('📊 batchAnalyses.size:', batchAnalyses.size);
    console.log('📈 deepAnalysisResults.size:', deepAnalysisResults.size);

    if (batchAnalyses.size === 0 && deepAnalysisResults.size === 0) {
      alert('没有可导出的曲线数据');
      return;
    }

    try {
      // Collect curve data from all analyzed videos
      const curveDataArray = [];

      // Get data from deep analysis results (preferred)
      deepAnalysisResults.forEach((deepResult, videoId) => {
        console.log('🔍 检查深度分析结果:', videoId, deepResult);
        if (deepResult.interval && deepResult.statistics) {
          // Find corresponding batch analysis for full curve data
          const batchAnalysis = batchAnalyses.get(deepResult.videoId);
          console.log('🔍 查找对应的批量分析:', deepResult.videoId, batchAnalysis);
          if (batchAnalysis && batchAnalysis.results && batchAnalysis.results.series) {
            console.log('✅ 找到有效的批量分析数据，提取曲线...');
            const curveData = extractCurveData(batchAnalysis.results.series);
            console.log('📈 提取的曲线数据长度:', {
              time: curveData.time.length,
              white: curveData.white.length,
              blue: curveData.blue.length,
              yellow: curveData.yellow.length,
              pink: curveData.pink.length,
              purple: curveData.purple.length,
              orange: curveData.orange.length
            });

            // Debug: Check if backend returned orange data
            const hasOrangeData = batchAnalysis.results.series.some(p => p.orange !== undefined);
            console.log(`🔍 检查后端数据是否包含橙色曲线: ${hasOrangeData}`);
            if (batchAnalysis.results.series.length > 0) {
              console.log('🔍 第一个数据点的结构:', batchAnalysis.results.series[0]);
            }

            curveDataArray.push({
              fileName: deepResult.videoName,
              videoId: deepResult.videoId,
              duration: batchAnalysis.results.series[batchAnalysis.results.series.length - 1]?.t || 0,
              sampleFps: Number(sampleFpsEl?.value || 8),
              interval: deepResult.interval,
              statistics: deepResult.statistics,
              curves: curveData
            });
          } else {
            console.warn('⚠️ 未找到对应的批量分析数据或缺少series数据');
          }
        } else {
          console.log('⏭️ 跳过没有interval或statistics的深度分析结果');
        }
      });

      // If no deep analysis data, fall back to batch analysis results
      if (curveDataArray.length === 0) {
        console.log('🔄 没有深度分析数据，回退到批量分析结果...');
        batchAnalyses.forEach((analysis, videoId) => {
          console.log('🔍 检查批量分析:', videoId, analysis);
          if (analysis.results && analysis.results.series) {
            console.log('✅ 找到有效的批量分析数据，提取曲线...');
            const curveData = extractCurveData(analysis.results.series);
            console.log('📈 提取的曲线数据长度:', {
              time: curveData.time.length,
              white: curveData.white.length,
              blue: curveData.blue.length,
              yellow: curveData.yellow.length,
              pink: curveData.pink.length,
              purple: curveData.purple.length,
              orange: curveData.orange.length
            });

            curveDataArray.push({
              fileName: analysis.fileName,
              videoId: analysis.id,
              duration: analysis.results.series[analysis.results.series.length - 1]?.t || 0,
              sampleFps: Number(sampleFpsEl?.value || 8),
              curves: curveData
            });
          } else {
            console.warn('⚠️ 批量分析缺少results或series数据');
          }
        });
      }

      console.log('📊 最终收集到的曲线数据数量:', curveDataArray.length);
      if (curveDataArray.length === 0) {
        console.error('❌ 没有找到有效的曲线数据');
        alert('没有找到有效的曲线数据');
        return;
      }

      // Export to JSON format
      exportCurveDataJSON(curveDataArray);

      // Export to CSV format
      exportCurveDataCSV(curveDataArray);

    } catch (error) {
      console.error('导出曲线数据失败:', error);
      alert('导出曲线数据失败: ' + error.message);
    }
  }

  // Extract curve data from analysis series
  function extractCurveData(series) {
    console.log('🔍 extractCurveData 输入检查:', {
      hasSeries: !!series,
      seriesLength: series ? series.length : 0,
      firstItem: series && series.length > 0 ? series[0] : null
    });

    if (!series || series.length === 0) {
      console.warn('⚠️ 没有有效的series数据');
      return { time: [], white: [], blue: [], yellow: [], pink: [], purple: [], orange: [] };
    }

    // Debug: Check if any data points have orange property
    const pointsWithOrange = series.filter(p => p.orange !== undefined);
    console.log(`🔍 包含橙色数据的数据点数量: ${pointsWithOrange.length} / ${series.length}`);
    if (pointsWithOrange.length > 0) {
      console.log('🔍 橙色数据样本:', pointsWithOrange.slice(0, 3).map(p => p.orange));
    }

    const time = series.map(p => p.t);
    const white = series.map(p => p.roi);

    // Calculate blue curve (d1)
    const blue = [];
    for (let i = 0; i < white.length; i++) {
      if (i === 0) {
        blue.push(0);
      } else {
        const base = analyzedBaseline || 0;
        blue.push(white[i] - base);
      }
    }

    // Calculate yellow curve (d2) - first derivative of blue
    const yellow = [];
    for (let i = 0; i < blue.length; i++) {
      if (i === 0) {
        yellow.push(0);
      } else {
        yellow.push(blue[i] - blue[i-1]);
      }
    }

    const pink = series.map(p => p.std || 0);
    const purple = series.map(p => p.high || 0);
    const orange = series.map(p => p.orange || 0);

    console.log('✅ extractCurveData 成功提取曲线:', {
      timeLength: time.length,
      whiteLength: white.length,
      blueLength: blue.length,
      yellowLength: yellow.length,
      pinkLength: pink.length,
      purpleLength: purple.length,
      orangeLength: orange.length,
      sampleValues: {
        time: time.slice(0, 3),
        white: white.slice(0, 3),
        blue: blue.slice(0, 3),
        yellow: yellow.slice(0, 3),
        pink: pink.slice(0, 3),
        purple: purple.slice(0, 3),
        orange: orange.slice(0, 3)
      }
    });

    return { time, white, blue, yellow, pink, purple, orange };
  }

  // Export curve data to JSON format
  function exportCurveDataJSON(curveDataArray) {
    const jsonData = {
      exportTime: new Date().toISOString(),
      totalVideos: curveDataArray.length,
      sampleFps: Number(sampleFpsEl?.value || 8),
      videos: curveDataArray
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `曲线数据_${new Date().toISOString().slice(0, 10)}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Export curve data to CSV format (flattened)
  function exportCurveDataCSV(curveDataArray) {
    let csvContent = '文件名,视频ID,时长(s),采样率,时间点(s),白曲线,蓝曲线,黄曲线,粉曲线,紫曲线,橙曲线\n';

    curveDataArray.forEach(video => {
      const maxPoints = video.curves.time.length;
      for (let i = 0; i < maxPoints; i++) {
        csvContent += [
          video.fileName,
          video.videoId,
          video.duration.toFixed(3),
          video.sampleFps,
          video.curves.time[i].toFixed(3),
          video.curves.white[i].toFixed(1),
          video.curves.blue[i].toFixed(3),
          video.curves.yellow[i].toFixed(3),
          video.curves.pink[i].toFixed(3),
          video.curves.purple[i].toFixed(1),
          video.curves.orange[i].toFixed(1)
        ].join(',') + '\n';
      }
    });

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `曲线数据_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function showDeepAnalysisProgress(show, percentage = 0, status = '准备就绪') {
    if (!deepAnalysisProgress) return;

    if (show) {
      deepAnalysisProgress.style.display = 'block';
      if (deepProgressText) deepProgressText.textContent = percentage + '%';
      if (deepProgressFill) deepProgressFill.style.width = percentage + '%';
      if (deepAnalysisStatus) deepAnalysisStatus.textContent = status;
    } else {
      deepAnalysisProgress.style.display = 'none';
    }
  }

  // Batch Chart Functions
  function showBatchChartsInterface() {
    if (curveDataUpload) {
      curveDataUpload.style.display = 'block';
    }
    if (batchChartsContainer) {
      batchChartsContainer.style.display = 'block';
    }
  }

  function hideBatchChartsInterface() {
    if (curveDataUpload) {
      curveDataUpload.style.display = 'none';
    }
    if (batchChartsContainer) {
      batchChartsContainer.style.display = 'none';
    }
  }

  // Render batch charts from loaded curve data with virtual scrolling
  function renderBatchCharts(curveDataArray) {
    if (!curveDataArray || curveDataArray.length === 0) {
      alert('没有可显示的曲线数据');
      return;
    }

    // Clear existing charts
    clearBatchCharts();

    // Store curve data
    batchCurveData = curveDataArray;

    // Set up virtual scrolling
    setupVirtualScrolling();

    // Create visible charts immediately (viewport optimization)
    renderVisibleCharts();
  }

  // Virtual scrolling setup
  function setupVirtualScrolling() {
    if (!chartsGrid) return;

    // Set initial grid height
    const itemHeight = 280; // Approximate height per chart
    const padding = 32;
    const maxVisibleCharts = Math.ceil((window.innerHeight - 200) / itemHeight);

    chartsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(500px, 1fr))';
    chartsGrid.style.maxHeight = (maxVisibleCharts * itemHeight + padding) + 'px';

    // Add scroll listener for lazy loading
    chartsGrid.addEventListener('scroll', () => {
      if (!batchScrolling.active) {
        batchScrolling.active = true;
        setTimeout(() => {
          renderVisibleCharts();
          batchScrolling.active = false;
        }, 100); // Debounce scroll events
      }
    });

    // Initialize virtual scrolling state
    batchScrolling = {
      active: false,
      visibleStartIndex: 0,
      visibleEndIndex: maxVisibleCharts,
      renderedCharts: new Set()
    };
  }

  // Render only visible charts
  function renderVisibleCharts() {
    if (!chartsGrid || !batchCurveData.length) return;

    const containerRect = chartsGrid.getBoundingClientRect();
    const scrollTop = chartsGrid.scrollTop;
    const itemHeight = 280;
    const padding = 32;

    // Calculate visible range
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight));
    const endIndex = Math.min(
      batchCurveData.length,
      Math.ceil((scrollTop + containerRect.height) / itemHeight)
    );

    // Remove charts that are no longer visible
    const visibleRange = new Set();
    for (let i = startIndex; i < endIndex; i++) {
      visibleRange.add(i);
    }

    // Remove off-screen charts
    batchChartInstances = batchChartInstances.filter((canvas, index) => {
      if (canvas && canvas.parentNode) {
        const canvasIndex = parseInt(canvas.id.replace('batchChartCanvas_', ''));
        if (!visibleRange.has(canvasIndex)) {
          canvas.parentNode.remove();
          return false;
        }
      }
      return true;
    });

    // Add new visible charts
    for (let i = startIndex; i < endIndex && i < batchCurveData.length; i++) {
      if (!batchScrolling.renderedCharts.has(i)) {
        const videoData = batchCurveData[i];
        createBatchChart(videoData, i);
        batchScrolling.renderedCharts.add(i);
      }
    }

    // Update virtual scrolling state
    batchScrolling.visibleStartIndex = startIndex;
    batchScrolling.visibleEndIndex = endIndex;
  }

  // Create a single batch chart
  function createBatchChart(videoData, index) {
    if (!videoData.curves || !videoData.curves.time) {
      console.warn(`Invalid curve data for video: ${videoData.fileName}`);
      return;
    }

    const chartContainer = document.createElement('div');
    chartContainer.className = 'batch-chart-item';
    chartContainer.innerHTML = `
      <div class="batch-chart-header">
        <span class="chart-title">${videoData.fileName}</span>
        <span class="chart-info">时长: ${videoData.duration.toFixed(1)}s</span>
      </div>
      <div class="batch-chart-canvas">
        <canvas id="batchChartCanvas_${index}" width="400" height="200"></canvas>
      </div>
    `;

    if (chartsGrid) {
      chartsGrid.appendChild(chartContainer);
    }

    // Render chart on canvas
    const canvas = document.getElementById(`batchChartCanvas_${index}`);
    if (canvas) {
      renderBatchChartCanvas(canvas, videoData.curves, videoData.fileName);
      batchChartInstances.push(canvas);
    }
  }

  // Render chart on canvas element
  function renderBatchChartCanvas(canvas, curves, fileName) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Setup chart dimensions
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (curves.time.length === 0) return;

    // Calculate data ranges
    const minTime = Math.min(...curves.time);
    const maxTime = Math.max(...curves.time);
    const timeRange = maxTime - minTime || 1;

    // Calculate Y range for all visible curves
    let minY = Infinity, maxY = -Infinity;
    const visibleCurves = [
      { data: curves.white, color: '#ffffff', label: 'white' },
      { data: curves.blue, color: '#4fc3f7', label: 'blue' },
      { data: curves.yellow, color: '#fbbf24', label: 'yellow' },
      { data: curves.pink, color: '#f9a8d4', label: 'pink' },
      { data: curves.purple, color: '#a855f7', label: 'purple' },
      { data: curves.orange, color: '#fb923c', label: 'orange' }
    ].filter(curve => {
      switch(curve.label) {
        case 'white': return batchChartState.showWhite;
        case 'blue': return batchChartState.showBlue;
        case 'yellow': return batchChartState.showYellow;
        case 'pink': return batchChartState.showPink;
        case 'purple': return batchChartState.showPurple;
        case 'orange': return batchChartState.showOrange;
        default: return false;
      }
    });

    visibleCurves.forEach(curve => {
      const validValues = curve.data.filter(v => !isNaN(v) && isFinite(v));
      if (validValues.length > 0) {
        minY = Math.min(minY, ...validValues);
        maxY = Math.max(maxY, ...validValues);
      }
    });

    if (!isFinite(minY) || !isFinite(maxY)) {
      minY = -10;
      maxY = 10;
    }

    const yRange = maxY - minY || 1;

    // Draw background
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight * i / 5);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y labels
      const value = maxY - (yRange * i / 5);
      ctx.fillStyle = '#9da0a6';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(1), padding.left - 5, y + 3);
    }

    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
      const x = padding.left + (chartWidth * i / 5);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();

      // X labels
      const time = minTime + (timeRange * i / 5);
      ctx.fillStyle = '#9da0a6';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(time.toFixed(1), x, height - padding.bottom + 15);
    }

    // Draw curves
    visibleCurves.forEach(curve => {
      if (curve.data.length !== curves.time.length) return;

      ctx.strokeStyle = curve.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      let started = false;
      for (let i = 0; i < curves.time.length; i++) {
        const x = padding.left + ((curves.time[i] - minTime) / timeRange * chartWidth);
        const y = padding.top + ((maxY - curve.data[i]) / yRange * chartHeight);

        if (isFinite(x) && isFinite(y)) {
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }

      ctx.stroke();
    });

    // Draw title
    ctx.fillStyle = '#e5e5e5';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(fileName, width / 2, 15);
  }

  // Clear all batch charts
  function clearBatchCharts() {
    if (chartsGrid) {
      chartsGrid.innerHTML = '';
    }
    batchChartInstances = [];
    batchCurveData = [];

    // 清除虚拟滚动状态
    batchScrolling = { active: false, visibleStartIndex: 0, visibleEndIndex: 0, renderedCharts: new Set() };

    // 清除事件监听器
    if (batchScrolling.scrollListener) {
      chartsGrid.removeEventListener('scroll', batchScrolling.scrollListener);
      batchScrolling.scrollListener = null;
    }
    if (batchScrolling.resizeListener) {
      window.removeEventListener('resize', batchScrolling.resizeListener);
      batchScrolling.resizeListener = null;
    }

    console.log('🗑️ 已清除所有批量图表和虚拟滚动状态');
  }

  // Load curve data from file
  function loadCurveDataFromFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const content = e.target.result;
        let data;

        if (file.name.endsWith('.json')) {
          data = JSON.parse(content);
          if (data.videos && Array.isArray(data.videos)) {
            renderBatchCharts(data.videos);
          } else {
            alert('JSON文件格式不正确');
          }
        } else if (file.name.endsWith('.csv')) {
          data = parseCSVToCurveData(content);
          if (data.length > 0) {
            renderBatchCharts(data);
          } else {
            alert('CSV文件格式不正确或无数据');
          }
        } else {
          alert('不支持的文件格式，请选择.json或.csv文件');
        }
      } catch (error) {
        console.error('解析文件失败:', error);
        alert('解析文件失败: ' + error.message);
      }
    };
    reader.readAsText(file);
  }

  // Parse CSV to curve data format
  function parseCSVToCurveData(csvContent) {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const videosMap = new Map();

    // Process data lines
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;

      const fileName = values[0];
      const videoId = values[1];
      const duration = parseFloat(values[2]);
      const sampleFps = parseInt(values[3]);
      const time = parseFloat(values[4]);
      const white = parseFloat(values[5]);
      const blue = parseFloat(values[6]);
      const yellow = parseFloat(values[7]);
      const pink = parseFloat(values[8]);
      const purple = parseFloat(values[9]);
      const orange = parseFloat(values[10] || 0); // Handle missing orange data

      const key = `${fileName}_${videoId}`;
      if (!videosMap.has(key)) {
        videosMap.set(key, {
          fileName,
          videoId,
          duration,
          sampleFps,
          curves: { time: [], white: [], blue: [], yellow: [], pink: [], purple: [], orange: [] }
        });
      }

      const video = videosMap.get(key);
      video.curves.time.push(time);
      video.curves.white.push(white);
      video.curves.blue.push(blue);
      video.curves.yellow.push(yellow);
      video.curves.pink.push(pink);
      video.curves.purple.push(purple);
      video.curves.orange.push(orange);
    }

    return Array.from(videosMap.values());
  }

  // Update batch chart visibility based on toggle states
  function updateBatchChartVisibility() {
    batchChartState = {
      showWhite: batchShowWhite ? batchShowWhite.checked : true,
      showBlue: batchShowBlue ? batchShowBlue.checked : true,
      showYellow: batchShowYellow ? batchShowYellow.checked : true,
      showPink: batchShowPink ? batchShowPink.checked : true,
      showPurple: batchShowPurple ? batchShowPurple.checked : true,
      showOrange: batchShowOrange ? batchShowOrange.checked : true
    };

    // Re-render all charts
    batchCurveData.forEach((videoData, index) => {
      const canvas = document.getElementById(`batchChartCanvas_${index}`);
      if (canvas) {
        renderBatchChartCanvas(canvas, videoData.curves, videoData.fileName);
      }
    });
  }

// Batch processing queue engine
  async function processBatchQueue() {
    if (batchFiles.length === 0) {
      alert('请先加载视频文件');
      return;
    }

    batchQueue.videos = batchFiles.map(file => createAnalysisData(file));
    batchQueue.processing = true;
    batchQueue.currentIndex = 0;
    batchQueue.paused = false;
    batchQueue.cancelled = false;

    showBatchProgress(true);
    updateBatchProgress(0, batchQueue.videos.length, '开始批量分析...');

    for (let i = 0; i < batchQueue.videos.length; i++) {
      if (batchQueue.cancelled) {
        updateBatchProgress(i, batchQueue.videos.length, '批量分析已取消');
        break;
      }

      while (batchQueue.paused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const analysisData = batchQueue.videos[i];
      batchQueue.currentIndex = i;

      try {
        analysisData.status = 'processing';
        updateBatchProgress(i, batchQueue.videos.length, `正在分析: ${analysisData.fileName}`);

        // Use default ROI for batch processing (centered 50% area)
        const defaultRoi = { x: 0.25, y: 0.25, w: 0.5, h: 0.5 };

        // Create form data for analysis
        const formData = new FormData();
        formData.append('file', analysisData.file);
        formData.append('roi_x', String(defaultRoi.x));
        formData.append('roi_y', String(defaultRoi.y));
        formData.append('roi_w', String(defaultRoi.w));
        formData.append('roi_h', String(defaultRoi.h));
        formData.append('sample_fps', String(Number(sampleFpsEl?.value || 8)));
        formData.append('methods', 'sudden,threshold,relative');

        // Add parameters
        Object.entries(p).forEach(([key, el]) => {
          if (el) {
            let value = el.value;
            // Ensure default values for critical parameters
            if (key === 'conditional_threshold1' && (value === '' || value === undefined)) value = '120';
            if (key === 'conditional_threshold2' && (value === '' || value === undefined)) value = '160';
            if (key === 'high_threshold' && (value === '' || value === undefined)) value = '130';
            formData.append(key, String(value));
          }
        });

        // Debug: Log batch analysis parameters (only for first few analyses)
        if (i < 2) {
          console.log(`📤 Sending batch analysis parameters for ${analysisData.fileName}:`, {
            conditional_threshold1: p.conditional_threshold1?.value || '120',
            conditional_threshold2: p.conditional_threshold2?.value || '160',
            high_threshold: p.high_threshold?.value || '130'
          });
        }

        const response = await fetch('http://localhost:8421/analyze', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Store analysis results
        analysisData.status = 'completed';
        analysisData.results = data;
        analysisData.roi = defaultRoi;
        analysisData.progress = 100;

        // Add to batch analyses map
        batchAnalyses.set(analysisData.id, analysisData);

        // Add to video selector
        addVideoToSelector(analysisData.id, analysisData.fileName);

        updateBatchProgress(i + 1, batchQueue.videos.length, `已完成: ${analysisData.fileName}`);

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error('Batch analysis error:', error);
        analysisData.status = 'error';
        analysisData.error = error.message;
        updateBatchProgress(i + 1, batchQueue.videos.length, `错误: ${analysisData.fileName} - ${error.message}`);
      }
    }

    batchQueue.processing = false;
    updateBatchProgress(batchQueue.videos.length, batchQueue.videos.length, '批量分析完成');

    // Enable export controls
    enableExportControls();

    // Select first completed analysis if available
    const completedAnalyses = Array.from(batchAnalyses.values()).filter(a => a.status === 'completed');
    if (completedAnalyses.length > 0 && !currentVideoId) {
      selectAnalysis(completedAnalyses[0].id);
    }
  }

  function addVideoToSelector(videoId, fileName) {
    const option = document.createElement('option');
    option.value = videoId;
    option.textContent = fileName;
    videoSelector.appendChild(option);
    videoSelector.disabled = false;
  }

  function selectAnalysis(videoId) {
    const analysisData = batchAnalyses.get(videoId);
    if (!analysisData || analysisData.status !== 'completed') {
      return;
    }

    currentVideoId = videoId;

    // Update current analysis data
    const { has_hem, events = [], baseline = 0, series = [] } = analysisData.results;
    analyzedXs = series.map(p => p.t);
    analyzedEvents = events;
    analyzedBaseline = baseline;
    analyzedSeries = series;

    // Initialize timeline state (critical for timeline click functionality)
    const seriesStart = analyzedXs.length ? analyzedXs[0] : 0;
    const seriesEnd = analyzedXs.length ? analyzedXs[analyzedXs.length - 1] : 0;
    timelineState.fullMin = seriesStart;
    timelineState.fullMax = seriesEnd;
    timelineState.min = seriesStart;
    timelineState.max = seriesEnd;

    // Recompute shaded intervals and update timeline
    recomputeShadedIntervals();
    renderTimeline();
    updateBlueJudge();

    // Update video selector
    videoSelector.value = videoId;

    // Re-render everything
    rerenderAll();

    // Update video if possible
    if (analysisData.file) {
      const url = URL.createObjectURL(analysisData.file);
      video.src = url;
      video.currentTime = 0;
      analyzeBtn.disabled = false;
      resultText.textContent = `已加载: ${analysisData.fileName}`;

      // Update status with analysis info
      const statusInfo = `视频: ${analysisData.fileName} | 检测到HEM: ${has_hem ? '是' : '否'} | 事件数: ${events.length}`;
      if (statusEl) {
        statusEl.textContent = statusInfo;
      }
    }

    console.log('Switched to analysis:', videoId, analysisData.fileName);
  }

  // Batch analysis event listeners
  if (batchLoadBtn) {
    batchLoadBtn.addEventListener('click', () => {
      batchFileInput.click();
    });
  }

  if (batchFileInput) {
    batchFileInput.addEventListener('change', (e) => {
      addBatchFiles(e.target.files);
    });
  }

  if (clearFilesBtn) {
    clearFilesBtn.addEventListener('click', () => {
      clearBatchFiles();
    });
  }

  if (batchAnalyzeBtn) {
    batchAnalyzeBtn.addEventListener('click', () => {
      if (batchQueue.processing) {
        if (confirm('批量分析正在进行中，确定要取消吗？')) {
          batchQueue.cancelled = true;
          batchQueue.processing = false;
          showBatchProgress(false);
        }
      } else {
        processBatchQueue();
      }
    });
  }

  if (batchDeepAnalyzeBtn) {
    batchDeepAnalyzeBtn.addEventListener('click', () => {
      if (deepAnalysisProcessing) {
        if (confirm('深度分析正在进行中，确定要取消吗？')) {
          deepAnalysisProcessing = false;
          showDeepAnalysisProgress(false);
        }
      } else {
        performBatchDeepAnalysis();
      }
    });
  }

  // Drag and drop functionality
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      addBatchFiles(e.dataTransfer.files);
    });
  }

  // Video selector change event
  if (videoSelector) {
    videoSelector.addEventListener('change', (e) => {
      const videoId = e.target.value;
      if (videoId) {
        selectAnalysis(videoId);
      }
    });
  }

  if (blueMaxThreshEl) {
    blueMaxThreshEl.addEventListener('input', ()=>{ updateBlueJudge(); });
  }

  // Export curve data button
  if (exportCurveDataBtn) {
    exportCurveDataBtn.addEventListener('click', () => {
      exportCurveDataToFiles();
    });
  }

  // Batch charts button
  if (batchChartsBtn) {
    batchChartsBtn.addEventListener('click', () => {
      showBatchChartsInterface();
    });
  }

  // Clear batch charts button
  if (clearBatchChartsBtn) {
    clearBatchChartsBtn.addEventListener('click', () => {
      clearBatchCharts();
      hideBatchChartsInterface();
    });
  }

  // Curve data file input
  if (curveDataLoadBtn) {
    curveDataLoadBtn.addEventListener('click', () => {
      curveDataFileInput.click();
    });
  }

  if (curveDataFileInput) {
    curveDataFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        loadCurveDataFromFile(e.target.files[0]);
        showBatchChartsInterface();
      }
    });
  }

  // Curve data drag and drop
  if (curveDataDropZone) {
    curveDataDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      curveDataDropZone.classList.add('drag-over');
    });

    curveDataDropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      curveDataDropZone.classList.remove('drag-over');
    });

    curveDataDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      curveDataDropZone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        loadCurveDataFromFile(e.dataTransfer.files[0]);
        showBatchChartsInterface();
      }
    });
  }

  // Batch chart curve toggles
  [batchShowWhite, batchShowBlue, batchShowYellow, batchShowPink, batchShowPurple, batchShowOrange].forEach((toggle, index) => {
    if (toggle) {
      toggle.addEventListener('change', () => {
        updateBatchChartVisibility();
      });
    }
  });

  // Peak detection event listeners
  if (detectPeaksBtn) {
    detectPeaksBtn.addEventListener('click', () => {
      updatePeakDetection();
    });
  }

  if (clearPeaksBtn) {
    clearPeaksBtn.addEventListener('click', () => {
      clearPeaks();
    });
  }

  // Enable peak detection buttons when analysis is complete
  function enablePeakDetectionControls() {
    const hasData = analyzedSeries && analyzedSeries.length > 0;
    if (detectPeaksBtn) {
      detectPeaksBtn.disabled = !hasData;
    }
    if (clearPeaksBtn) {
      clearPeaksBtn.disabled = !hasData || detectedPeaks.length === 0;
    }
  }

  // Enable export button when batch analysis completes
  function enableExportControls() {
    if (exportCurveDataBtn) {
      exportCurveDataBtn.disabled = batchAnalyses.size === 0 && deepAnalysisResults.size === 0;
    }
    if (batchChartsBtn) {
      batchChartsBtn.disabled = batchAnalyses.size === 0 && deepAnalysisResults.size === 0;
    }
  }

} // Close script scope
