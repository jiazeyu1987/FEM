(function(){
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
  const showWhiteEl = document.getElementById('showWhite');
  const sampleFpsEl = document.getElementById('sampleFps');
  const methodsEls = document.querySelectorAll('.method');
  const blueMaxThreshEl = document.getElementById('blue_max_thresh');
  // ROI控件
  const selectROICenterBtn = document.getElementById('selectROICenterBtn');
  const roiWidthEl = document.getElementById('roi_width');
  const roiHeightEl = document.getElementById('roi_height');
  const roiCenterInfoEl = document.getElementById('roi_center_info');
  const thresholdInfoSection = document.getElementById('thresholdInfoSection');
  const currentThresholdInfoEl = document.getElementById('currentThresholdInfo');

  // parameter inputs
  const p = {
    smooth_k: document.getElementById('p_smooth_k'),
    baseline_n: document.getElementById('p_baseline_n'),
    sudden_k: document.getElementById('p_sudden_k'),
    sudden_min: document.getElementById('p_sudden_min'),
    threshold_delta: document.getElementById('p_threshold_delta'),
    threshold_hold: document.getElementById('p_threshold_hold'),
    relative_delta: document.getElementById('p_relative_delta'),
    // brightness_threshold: document.getElementById('brightness_threshold'), // 移除手动控制
    // timeline shading thresholds (frontend-only)
    rise_thresh: document.getElementById('p_rise_thresh'),
    fall_thresh: document.getElementById('p_fall_thresh'),
  };

  // 批量阈值分析配置
  const THRESHOLD_CONFIG = {
    start: 60,
    end: 200,
    step: 10,
    values: []
  };

  // 生成阈值数组
  for (let t = THRESHOLD_CONFIG.start; t <= THRESHOLD_CONFIG.end; t += THRESHOLD_CONFIG.step) {
    THRESHOLD_CONFIG.values.push(t);
  }

  let roi = null; // normalized {x,y,w,h}
  let roiCenter = null; // {x, y} in pixel coordinates
  let selectingROICenter = false; // 是否正在选择ROI中心点
  let dragging = false; let start = null; let rectPx = null;
  let analyzedXs = []; let analyzedEvents = []; let analyzedSeries = []; let analyzedBaseline = 0;
  let shadedIntervals = []; // [{start, end}] regions to shade on timeline
  let lastBlueJudge = null;
  const timelineState = { fullMin: 0, fullMax: 0, min: 0, max: 0 };
  let zoom = 1.0;
  let panX = 0, panY = 0; // videoWrap translation in panel pixels
  let isPanning = false; let panStart = {x:0,y:0}; let panOrigin = {x:0,y:0};
  let roiVisible = true;
  const chartState = { showBlue: (showBlueEl? showBlueEl.checked : true), showYellow: (showYellowEl? showYellowEl.checked : true), showWhite: (showWhiteEl? showWhiteEl.checked : true), yZoom: 1, padLeft: 56 };

  // Load video preview
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    video.src = url;
    analyzeBtn.disabled = !(roi && roi.w > 0 && roi.h > 0);
    resultText.textContent = '加载视频，设置ROI后点击分析…';
  });

  // ROI中心点选择按钮事件
  selectROICenterBtn.addEventListener('click', () => {
    if (!video.src || video.readyState < 2) {
      alert('请先加载视频');
      return;
    }
    selectingROICenter = true;
    selectROICenterBtn.classList.add('active');
    selectROICenterBtn.textContent = '在视频上点击选择中心点';
    overlay.style.cursor = 'crosshair';
    statusEl.textContent = '请在视频上点击选择ROI中心点';
  });

  // ROI尺寸变化时更新ROI
  roiWidthEl.addEventListener('input', updateROIFromCenter);
  roiHeightEl.addEventListener('input', updateROIFromCenter);

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

  // 增强的HEM标准ROI可视化
  function drawOverlay(){
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0,0,overlay.width, overlay.height);
    if (rectPx && roiVisible){
      // HEM标准ROI矩形
      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth = 2;
      ctx.strokeRect(rectPx.x, rectPx.y, rectPx.w, rectPx.h);
      ctx.fillStyle = 'rgba(79,195,247,0.15)';
      ctx.fillRect(rectPx.x, rectPx.y, rectPx.w, rectPx.h);

      // HEM增强: 绘制中心点标记
      if (roiCenter) {
        // 中心十字线
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(roiCenter.x - 5, roiCenter.y);
        ctx.lineTo(roiCenter.x + 5, roiCenter.y);
        ctx.moveTo(roiCenter.x, roiCenter.y - 5);
        ctx.lineTo(roiCenter.x, roiCenter.y + 5);
        ctx.stroke();

        // 中心点圆圈
        ctx.beginPath();
        ctx.arc(roiCenter.x, roiCenter.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

      // HEM增强: 显示ROI尺寸标注
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      const sizeText = `${rectPx.w}×${rectPx.h}`;
      const textX = rectPx.x + 2;
      const textY = rectPx.y - 2;

      // 文字背景
      const textWidth = ctx.measureText(sizeText).width;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(textX - 1, textY - 10, textWidth + 2, 12);

      // 文字
      ctx.fillStyle = '#ffffff';
      ctx.fillText(sizeText, textX, textY);
    }
  }

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

  function localPos(e){
    const rect = overlay.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / Math.max(zoom,1e-6), y: (e.clientY - rect.top) / Math.max(zoom,1e-6) };
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
    if (e.button !== 0) return; // only left button

    // 如果正在选择ROI中心点
    if (selectingROICenter) {
      e.preventDefault();
      const p = localPos(e);
      roiCenter = {x: p.x, y: p.y};
      updateROIFromCenter();
      finishROICenterSelection();
      return;
    }

    // 原有的拖拽绘制ROI逻辑（保留但禁用）
    // const p = localPos(e);
    // start = {x: p.x, y: p.y};
    // dragging = true; rectPx = {x:start.x, y:start.y, w:0, h:0};
    // drawOverlay();
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
  function applyExistingRoiToOverlay(){
  return roi !== null;
}

// 根据中心点和尺寸更新ROI (按HEM系统精确逻辑)
function updateROIFromCenter() {
  if (!roiCenter || !overlay.width || !overlay.height) {
    console.log('HEM逻辑检查: 缺少必要参数', { roiCenter, overlayWidth: overlay.width, overlayHeight: overlay.height });
    return;
  }

  const width = Number(roiWidthEl.value) || 80;
  const height = Number(roiHeightEl.value) || 160;

  console.log('HEM ROI计算开始:', {
    centerPoint: { x: roiCenter.x, y: roiCenter.y },
    roiSize: { width, height },
    videoSize: { width: overlay.width, height: overlay.height }
  });

  // 计算ROI矩形，确保不超出视频边界 (严格按照HEM系统逻辑)
  const halfW = width / 2;
  const halfH = height / 2;

  // HEM系统边界验证: 计算理想的ROI左上角坐标
  const idealX = roiCenter.x - halfW;
  const idealY = roiCenter.y - halfH;

  // HEM系统边界检查: 确保ROI完全在视频边界内
  const x = Math.max(0, Math.min(idealX, overlay.width - width));
  const y = Math.max(0, Math.min(idealY, overlay.height - height));

  // 验证边界调整
  const wasAdjusted = {
    x: idealX !== x,
    y: idealY !== y
  };

  if (wasAdjusted.x || wasAdjusted.y) {
    console.log('HEM边界调整:', {
      ideal: { x: idealX, y: idealY },
      adjusted: { x, y },
      reasons: {
        xLeft: idealX < 0,
        xRight: idealX > overlay.width - width,
        yTop: idealY < 0,
        yBottom: idealY > overlay.height - height
      }
    });
  }

  rectPx = {x, y, w: width, h: height};

  // 更新归一化的ROI坐标 (HEM系统标准)
  const normalizedROI = {
    x: x / overlay.width,
    y: y / overlay.height,
    w: width / overlay.width,
    h: height / overlay.height,
  };

  // 验证归一化坐标的有效性
  const isValidNormalized = (
    normalizedROI.x >= 0 && normalizedROI.x <= 1 &&
    normalizedROI.y >= 0 && normalizedROI.y <= 1 &&
    normalizedROI.w > 0 && normalizedROI.w <= 1 &&
    normalizedROI.h > 0 && normalizedROI.h <= 1 &&
    (normalizedROI.x + normalizedROI.w) <= 1 &&
    (normalizedROI.y + normalizedROI.h) <= 1
  );

  if (!isValidNormalized) {
    console.error('HEM错误: 归一化坐标无效', normalizedROI);
    return;
  }

  roi = normalizedROI;

  console.log('HEM ROI计算结果:', {
    pixelCoords: rectPx,
    normalizedCoords: roi,
    validation: { isValidNormalized, wasAdjusted }
  });

  // 更新UI状态 (增强的HEM标准信息显示)
  analyzeBtn.disabled = !fileInput.files?.[0];

  // 显示详细的ROI信息
  const roiInfo = [
    `中心: (${roiCenter.x.toFixed(0)}, ${roiCenter.y.toFixed(0)})`,
    `尺寸: ${width}×${height}px`,
    `归一化: (${roi.x.toFixed(3)}, ${roi.y.toFixed(3)})`,
    `归一化尺寸: ${roi.w.toFixed(3)}×${roi.h.toFixed(3)}`
  ];

  statusEl.textContent = `ROI = ${roiInfo.join(' | ')}`;
  roiCenterInfoEl.textContent = `像素: (${x.toFixed(0)}, ${y.toFixed(0)}) | 视频: ${overlay.width}×${overlay.height}`;

  // 添加ROI有效性状态
  if (wasAdjusted.x || wasAdjusted.y) {
    statusEl.textContent += ' [已调整]';
  }

  // 重新绘制ROI
  drawOverlay();

  // 通知ROI更新
  onROIUpdated();

  // HEM验证: 坐标一致性测试
  validateROICoordinates();
}

// HEM系统坐标一致性验证
function validateROICoordinates() {
  if (!roi || !roiCenter || !rectPx) {
    console.log('HEM验证: 缺少坐标数据，跳过验证');
    return;
  }

  console.log('=== HEM坐标一致性验证开始 ===');

  // 1. 验证像素坐标和归一化坐标的转换一致性
  const expectedNormalizedX = rectPx.x / overlay.width;
  const expectedNormalizedY = rectPx.y / overlay.height;
  const expectedNormalizedW = rectPx.w / overlay.width;
  const expectedNormalizedH = rectPx.h / overlay.height;

  const coordMismatch = {
    x: Math.abs(expectedNormalizedX - roi.x) > 0.001,
    y: Math.abs(expectedNormalizedY - roi.y) > 0.001,
    w: Math.abs(expectedNormalizedW - roi.w) > 0.001,
    h: Math.abs(expectedNormalizedH - roi.h) > 0.001
  };

  console.log('HEM坐标转换验证:', {
    pixelCoords: rectPx,
    normalizedCoords: roi,
    expectedNormalized: {
      x: expectedNormalizedX,
      y: expectedNormalizedY,
      w: expectedNormalizedW,
      h: expectedNormalizedH
    },
    mismatches: coordMismatch
  });

  // 2. 验证中心点与ROI矩形的一致性
  const expectedCenterX = rectPx.x + rectPx.w / 2;
  const expectedCenterY = rectPx.y + rectPx.h / 2;

  const centerMismatch = {
    x: Math.abs(expectedCenterX - roiCenter.x) > 1,
    y: Math.abs(expectedCenterY - roiCenter.y) > 1
  };

  console.log('HEM中心点验证:', {
    actualCenter: roiCenter,
    expectedCenter: { x: expectedCenterX, y: expectedCenterY },
    mismatches: centerMismatch
  });

  // 3. 验证边界有效性
  const boundaryValid = {
    withinBounds: (
      rectPx.x >= 0 &&
      rectPx.y >= 0 &&
      rectPx.x + rectPx.w <= overlay.width &&
      rectPx.y + rectPx.h <= overlay.height
    ),
    sizeValid: rectPx.w > 0 && rectPx.h > 0,
    normalizedValid: (
      roi.x >= 0 && roi.y >= 0 &&
      roi.x + roi.w <= 1 &&
      roi.y + roi.h <= 1
    )
  };

  console.log('HEM边界验证:', boundaryValid);

  // 4. 整体验证结果
  const allValid = (
    !coordMismatch.x && !coordMismatch.y && !coordMismatch.w && !coordMismatch.h &&
    !centerMismatch.x && !centerMismatch.y &&
    boundaryValid.withinBounds && boundaryValid.sizeValid && boundaryValid.normalizedValid
  );

  if (allValid) {
    console.log('✅ HEM验证通过: 所有坐标一致且有效');
  } else {
    console.warn('⚠️ HEM验证发现问题:', {
      coordMismatch,
      centerMismatch,
      boundaryValid
    });
  }

  console.log('=== HEM坐标一致性验证结束 ===');
}

// 完成ROI中心点选择
function finishROICenterSelection() {
  selectingROICenter = false;
  selectROICenterBtn.classList.remove('active');
  selectROICenterBtn.textContent = '点击选择中心点';
  overlay.style.cursor = 'default';

  if (roiCenter) {
    statusEl.textContent = `ROI中心点已选择: (${roiCenter.x.toFixed(0)}, ${roiCenter.y.toFixed(0)})`;
  }
}

// 禁用原有的拖拽绘制ROI功能
function finishDrag(){
  // 原有功能已禁用，使用中心点+尺寸的方式
  return;
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
    const file = fileInput.files?.[0];
    if (!file){ alert('请先选择视频'); return; }
    if (!roi){ alert('请在视频上框选ROI'); return; }
    resultText.textContent = '分析中…';
    statusEl.textContent = '上传并调用后端接口 /analyze';
    analyzeBtn.disabled = !(roi && roi.w > 0 && roi.h > 0);
    try {
      const fd = new FormData();
      fd.append('file', file);
      console.log('发送到后端的ROI坐标:', {
        roi_x: roi.x,
        roi_y: roi.y,
        roi_w: roi.w,
        roi_h: roi.h,
        roiCenter: roiCenter,
        rectPx: rectPx
      });
      fd.append('roi_x', String(roi.x));
      fd.append('roi_y', String(roi.y));
      fd.append('roi_w', String(roi.w));
      fd.append('roi_h', String(roi.h));
      fd.append('sample_fps', String(Number(sampleFpsEl.value || 8)));
      fd.append('methods', selectedMethods());
      // attach parameters (optional)
      Object.entries(p).forEach(([key, el])=>{ if (el && el.value !== '') fd.append(key, String(el.value)); });

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
  // 详细调试输出整个响应数据
  console.log('=== 完整的响应数据 ===');
  console.log('data:', data);
  console.log('data类型:', typeof data);
  console.log('data keys:', Object.keys(data));
  console.log('data.frames_10_to_20:', data.frames_10_to_20);
  console.log('========================');

  const { has_hem, events = [], baseline = 0, series = [], frames_10_to_20 = null } = data;
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
    renderEventsTable([]);
    return;
  }

  const xs = series.map(p=>p.t);
  const roi = series.map(p=>p.roi);
  const ref = series.map(p=>p.ref);
  const dif = roi.map((v,i)=> v - ref[i]);
  const maxJump = (function(arr){ let m=0; for(let i=1;i<arr.length;i++){ m=Math.max(m, arr[i]-arr[i-1]); } return m; })(roi);

  // 计算蓝色和黄色曲线的最大值
  // 蓝线：当前帧ROI均值 - 之前所有帧ROI均值的平均
  const d1 = new Array(roi.length).fill(0);
  let acc = 0;
  for (let i = 0; i < roi.length; i++) {
    if (i === 0) {
      d1[i] = 0;
      acc += roi[i];
      continue;
    }
    const prevMean = acc / i; // mean of roi[0..i-1]
    d1[i] = roi[i] - prevMean;
    acc += roi[i];
  }
  // 黄线：ROI中高亮度像素占比
  const high_ratio = series.map(p=>p.high_ratio || 0);

  const blueMax = Math.max(...d1);
  const yellowMax = Math.max(...high_ratio);
  const roiMin = Math.min(...roi);
  const roiMax = Math.max(...roi);

  const stats = [
    stat('Baseline', baseline.toFixed(2)),
    stat('ROI mean', (roi.reduce((a,b)=>a+b,0)/Math.max(1,roi.length)).toFixed(2)),
    stat('ROI min', roiMin.toFixed(2)),
    stat('ROI max', roiMax.toFixed(2)),
    stat('Max jump', maxJump.toFixed(2)),
    stat('Max diff', Math.max(...dif).toFixed(2)),
    stat('Blue Max Δv', blueMax.toFixed(2)),
    stat('Yellow Max %', yellowMax.toFixed(1)),
    stat('Frames 10-20 Avg', (() => {
    // 如果后端提供了正确的数据，使用它
    if (frames_10_to_20 && frames_10_to_20.frame_count > 0 && typeof frames_10_to_20.average === 'number') {
      const frameDetails = frames_10_to_20.frames.map(f => `Frame ${f.frame_num}: ${f.roi_value.toFixed(2)}`).join(', ');
      const tooltip = `${frameDetails} (共${frames_10_to_20.frame_count}帧)`;
      return `<span title="${tooltip}">${frames_10_to_20.average.toFixed(2)}</span>`;
    }

    // 否则从series数据中计算前几个帧的近似值
    if (roi && roi.length >= 10) {
      // 使用前10个采样点的平均值作为近似
      const earlyRoiValues = roi.slice(0, Math.min(10, roi.length));
      const approximateAvg = earlyRoiValues.reduce((a, b) => a + b, 0) / earlyRoiValues.length;
      const tooltip = `基于前${earlyRoiValues.length}个采样点的近似值 (第10~20帧平均值)`;
      return `<span title="${tooltip}">${approximateAvg.toFixed(2)}</span>`;
    }

    // 如果都没有，显示基于基线的估计值
    if (baseline && series && series.length > 0) {
      const estimatedValue = baseline + 5; // 简单估计
      const tooltip = `基于基线的估计值 (基线: ${baseline.toFixed(2)})`;
      return `<span title="${tooltip}">${estimatedValue.toFixed(2)}</span>`;
    }

    return 'N/A';
  })()),
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
  renderEventsTable(events);
  updateBlueJudge();
}

// thresholds helper (kept close to shading logic)
function getThresholds(){
  const riseInput = document.getElementById('p_rise_thresh');
  const fallInput = document.getElementById('p_fall_thresh');
  const rise = Number((riseInput && riseInput.value) || 15.5);
  const fall = Number((fallInput && fallInput.value) || -3);
  return { rise, fall };
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
    // Use high_ratio for yellow curve (percentage of high brightness pixels in ROI)
    const high_ratio = series.map(p=>p.high_ratio || 0);

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
    if (isFinite(t) && !isNaN(t)){ video.currentTime = t; renderTimeline(); rerenderAll(); }
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
  video.addEventListener('timeupdate', ()=>{ renderTimeline(); rerenderAll(); });
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
    setLabelTextForInput('showYellow', 'Yellow Bright\\u0025');

    // events pane and table headers
    setText('.events-pane .panel-header, .events .events-header', '\u4E8B\u4EF6\u5217\u8868');
    const ths = document.querySelectorAll('#eventsTable thead th');
    if (ths && ths.length >= 3){
      ths[0].textContent = 'Time';
      ths[1].textContent = 'Type';
      ths[2].textContent = 'Score';
    }
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

  function renderEventsTable(events){
    const tbody = document.querySelector('#eventsTable tbody');
    tbody.innerHTML = '';
    const rows = (events||[]).map(ev=>{
      const t = fmtTime(ev.t||0);
      const type = labelFor(ev.type);
      const score = (ev.score!=null? ev.score.toFixed(2):'-');
      return `<tr><td>${t}</td><td>${type}</td><td>${score}</td></tr>`;
    }).join('');
    tbody.innerHTML = rows || '<tr><td colspan="3" style="color:#9da0a6">无事件</td></tr>';
  }
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
    const roi = v; // 确保变量名一致，用于白色曲线
    // 蓝线：当前帧ROI均值 - 之前所有帧ROI均值的平均
    const d1 = new Array(v.length).fill(0);
    let acc = 0;
    for (let i=0;i<v.length;i++){
      if (i === 0){ d1[i] = 0; acc += v[i]; continue; }
      const prevMean = acc / i; // mean of v[0..i-1]
      d1[i] = v[i] - prevMean;
      acc += v[i];
    }
    // Use high_ratio for yellow curve (percentage of high brightness pixels in ROI)
    const high_ratio = series.map(p=>p.high_ratio || 0);

    // window sync to timeline
    let minX = xs[0], maxX = xs[xs.length-1];
    if (timelineState && (timelineState.max - timelineState.min) > 0){
      minX = Math.max(minX, timelineState.min || minX);
      maxX = Math.min(maxX, timelineState.max || maxX);
      if (maxX <= minX){ minX = xs[0]; maxX = xs[xs.length-1]; }
    }

    // y-range from selected curves
    const inView = (arr)=> {
      if (!Array.isArray(arr) || arr.length === 0) return [];
      return arr.filter((_,i)=> xs[i] >= minX && xs[i] <= maxX);
    };
    const parts = [];
    if (chartState.showBlue && Array.isArray(d1)) parts.push(inView(d1).length? inView(d1):d1);
    if (chartState.showYellow && Array.isArray(high_ratio)) parts.push(inView(high_ratio).length? inView(high_ratio):high_ratio);
    if (chartState.showWhite && Array.isArray(roi)) parts.push(inView(roi).length? inView(roi):roi);
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

    if (chartState.showBlue && Array.isArray(d1) && d1.length === xs.length){
      ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 2; ctx.beginPath();
      xs.forEach((t,i)=>{
        if (t<minX || t>maxX || i >= d1.length || !Number.isFinite(d1[i])) return;
        const x=x2px(t), y=y2px(d1[i]);
        const prev=i>0 && xs[i-1]>=minX;
        (prev?ctx.lineTo(x,y):ctx.moveTo(x,y));
      });
      ctx.stroke();
    }
    if (chartState.showYellow && Array.isArray(high_ratio) && high_ratio.length === xs.length){
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.5; ctx.beginPath();
      xs.forEach((t,i)=>{
        if (t<minX || t>maxX || i >= high_ratio.length || !Number.isFinite(high_ratio[i])) return;
        const x=x2px(t), y=y2px(high_ratio[i]);
        const prev=i>0 && xs[i-1]>=minX;
        (prev?ctx.lineTo(x,y):ctx.moveTo(x,y));
      });
      ctx.stroke();
    }
    if (chartState.showWhite && Array.isArray(roi) && roi.length === xs.length){
      console.log('绘制白色曲线:', {
        showWhite: chartState.showWhite,
        roiLength: roi.length,
        xsLength: xs.length,
        roiSample: roi.slice(0, 3),
        minY: minY,
        maxY: maxY
      });
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath();
      let drawnPoints = 0;
      xs.forEach((t,i)=>{
        if (t<minX || t>maxX || i >= roi.length || !Number.isFinite(roi[i])) return;
        const x=x2px(t), y=y2px(roi[i]);
        const prev=i>0 && xs[i-1]>=minX;
        (prev?ctx.lineTo(x,y):ctx.moveTo(x,y));
        drawnPoints++;
      });
      console.log('白色曲线绘制了', drawnPoints, '个点');
      ctx.stroke();
    } else {
      console.log('白色曲线未绘制:', {
        showWhite: chartState.showWhite,
        isRoiArray: Array.isArray(roi),
        roiLength: roi?.length,
        xsLength: xs?.length,
        lengthsMatch: Array.isArray(roi) && roi.length === xs.length
      });
    }

    // labels for meaning
    let tx = padLeft + 4; let ty = padTop - 2; ty = Math.max(14, ty);
    ctx.font = '12px sans-serif';
    if (chartState.showBlue){ ctx.fillStyle = '#93c5fd'; ctx.fillText('蓝: 当前帧ROI均值 − 历史均值  X=时间(s)  Y=差值', tx, 14); }
    if (chartState.showYellow){ ctx.fillStyle = '#fbbf24'; ctx.fillText('黄: ROI中高亮度像素占比(%)  X=时间(s)  Y=百分比', tx, 28); }
    if (chartState.showWhite){ ctx.fillStyle = '#ffffff'; ctx.fillText('白: ROI内灰度实际均值  X=时间(s)  Y=灰度值', tx, 42); }

    // current time line
    if (!isNaN(video.currentTime)){
      const ct = video.currentTime; if (ct>=minX && ct<=maxX){ const x=x2px(ct); ctx.strokeStyle='#60a5fa'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x, padTop); ctx.lineTo(x, H-padBottom); ctx.stroke(); }
    }

    // expose padLeft for wheel hit-test
    chartState.padLeft = padLeft;
  }

  // toggles
  function syncToggles(){ chartState.showBlue = !!(showBlueEl?.checked ?? true); chartState.showYellow = !!(showYellowEl?.checked ?? true); chartState.showWhite = !!(showWhiteEl?.checked ?? true); rerenderAll(); }
  showBlueEl?.addEventListener('change', syncToggles);
  showYellowEl?.addEventListener('change', syncToggles);
  showWhiteEl?.addEventListener('change', syncToggles);
  blueMaxThreshEl?.addEventListener('input', ()=>{ updateBlueJudge(); });

  // ===== 批量处理功能 =====
  const selectFolderBtn = document.getElementById('selectFolderBtn');
  const folderInput = document.getElementById('folderInput');
  const batchAnalyzeBtn = document.getElementById('batchAnalyzeBtn');
  const batchProgressSection = document.getElementById('batchProgressSection');
  const batchResultsSection = document.getElementById('batchResultsSection');
  const batchFiles = document.getElementById('batchFiles');
  const fileCount = document.getElementById('fileCount');
  const exportBtn = document.getElementById('exportBtn');
  const exportCSVBtn = document.getElementById('exportCSVBtn');

  // 批量处理状态
  let batchFilesList = [];
  let batchResults = [];
  let batchProcessing = false;
  let savedROI = null;
  let firstVideoLoaded = false;

  // 初始化批量处理按钮状态 - 按钮始终可用
  console.log('初始化批量分析按钮状态:', batchAnalyzeBtn);
  if (batchAnalyzeBtn) {
    batchAnalyzeBtn.disabled = false; // 按钮始终可用
    console.log('批量分析按钮已启用（始终可用）');
  }

  // 选择文件夹按钮点击事件
  selectFolderBtn.addEventListener('click', () => {
    folderInput.click();
  });

  // 文件夹选择事件
  folderInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    batchFilesList = filterVideoFiles(files);

    if (batchFilesList.length === 0) {
      alert('所选文件夹中没有找到MP4视频文件');
      return;
    }

    displayFileList();
    batchProgressSection.style.display = 'block';
    thresholdInfoSection.style.display = 'block';
    currentThresholdInfoEl.textContent = `${THRESHOLD_CONFIG.start}-${THRESHOLD_CONFIG.end} (步长${THRESHOLD_CONFIG.step})`;

    // 加载第一个视频用于ROI选择
    loadFirstVideoForROI();
  });

  // 过滤MP4文件
  function filterVideoFiles(files) {
    return files.filter(file =>
      file.type === 'video/mp4' ||
      file.name.toLowerCase().endsWith('.mp4')
    );
  }

  // 显示文件列表
  function displayFileList() {
    fileCount.textContent = batchFilesList.length;
    batchFiles.innerHTML = '';

    batchFilesList.forEach((file, index) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'batch-file-item';
      fileItem.id = `batch-file-${index}`;
      fileItem.innerHTML = `
        <span>${file.name}</span>
        <span class="batch-file-status">等待中</span>
      `;
      batchFiles.appendChild(fileItem);
    });
  }

  // 加载第一个视频用于ROI选择
  async function loadFirstVideoForROI() {
    if (batchFilesList.length === 0) return;

    const firstFile = batchFilesList[0];
    const url = URL.createObjectURL(firstFile);
    video.src = url;

    console.log('正在加载第一个视频用于ROI选择:', firstFile.name);

    // 等待视频加载完成
    video.addEventListener('loadedmetadata', () => {
      autoFitHeight();
      statusEl.textContent = '请在视频上框选ROI区域，ROI将应用到所有视频（也可以在其他视频上选择ROI）';
      batchAnalyzeBtn.disabled = false; // 按钮始终可用
      firstVideoLoaded = true;
      console.log('第一个视频加载完成，等待ROI选择');
    }, { once: true });

    resultText.textContent = '请先选择ROI区域，然后开始批量分析';
    analyzeBtn.disabled = true; // 禁用单个分析按钮
  }

  // ROI更新监听 - 监听ROI变化
  function onROIUpdated() {
    console.log('ROI已更新，当前ROI:', roi);

    // 如果有ROI选择，自动保存用于批量处理
    if (roi && roi.w > 0 && roi.h > 0) {
      savedROI = {...roi};

      if (firstVideoLoaded && batchFilesList.length > 0) {
        statusEl.textContent = `ROI已设置，将应用到所有 ${batchFilesList.length} 个视频`;
      } else if (!selectingROICenter) {
        statusEl.textContent = `ROI已设置，可以在选择文件夹后进行批量分析`;
      }

      console.log('ROI已保存用于批量处理:', savedROI);
    }
  }

  // 批量分析按钮点击事件
  batchAnalyzeBtn.addEventListener('click', async () => {
    console.log('批量分析按钮被点击');
    console.log('当前ROI:', roi);
    console.log('savedROI:', savedROI);
    console.log('batchFilesList.length:', batchFilesList.length);

    // 检查是否选择了文件夹
    if (batchFilesList.length === 0) {
      alert('请先选择包含MP4视频的文件夹');
      return;
    }

    // 检查ROI - 优先使用当前ROI，如果没有则使用保存的ROI
    let roiToUse = null;
    if (roi && roi.w > 0 && roi.h > 0) {
      roiToUse = {...roi};
      console.log('使用当前ROI作为批量分析ROI:', roiToUse);
    } else if (savedROI) {
      roiToUse = savedROI;
      console.log('使用保存的ROI作为批量分析ROI:', roiToUse);
    }

    if (!roiToUse) {
      alert('请先在任意视频上框选ROI区域，然后再进行批量分析');
      return;
    }

    // 直接开始批量分析，无确认弹框
    await startBatchAnalysis();
  });

  // 开始批量分析
  async function startBatchAnalysis() {
    if (batchProcessing) return;

    batchProcessing = true;
    batchResults = [];
    batchAnalyzeBtn.disabled = true;
    selectFolderBtn.disabled = true;
    batchResultsSection.style.display = 'none';

    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');

    const totalAnalyses = batchFilesList.length * THRESHOLD_CONFIG.values.length;
    let completedAnalyses = 0;

    for (let i = 0; i < batchFilesList.length; i++) {
      const file = batchFilesList[i];

      // 更新文件状态
      updateFileStatus(i, 'processing', '阈值分析中...');

      for (let j = 0; j < THRESHOLD_CONFIG.values.length; j++) {
        const threshold = THRESHOLD_CONFIG.values[j];
        completedAnalyses++;

        // 更新进度
        const progress = (completedAnalyses / totalAnalyses) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `正在分析 ${i + 1}/${batchFilesList.length}: ${file.name} (阈值: ${threshold})`;

        // 更新当前阈值显示
        currentThresholdInfoEl.textContent = `${threshold} (分析中...)`;

        try {
          const result = await analyzeSingleFileWithThreshold(file, threshold);
          console.log(`文件 ${file.name} (阈值 ${threshold}) 分析完成，结果:`, result);

          if (result && result.series && result.series.length > 0) {
            console.log(`  - series长度: ${result.series.length}`);
            console.log(`  - 第一条数据:`, result.series[0]);
            console.log(`  - has_hem: ${result.has_hem}`);
            console.log(`  - 事件数: ${result.events?.length || 0}`);
            console.log(`  - Frames 10-20 Avg: ${result.frames_10_to_20?.average || 'N/A'}`);
          }

          // 提取Frames 10-20 Avg数值
          let frames1020Avg = null;
          if (result && result.frames_10_to_20 && result.frames_10_to_20.frame_count > 0) {
            frames1020Avg = result.frames_10_to_20.average;
            console.log(`✓ 使用后端提供的真实Frames 10-20 Avg: ${frames1020Avg.toFixed(2)}`);
          } else if (result && result.series && result.series.length > 0) {
            // 使用近似计算
            const roiValues = result.series.map(s => s.roi);
            const earlyRoiValues = roiValues.slice(0, Math.min(10, roiValues.length));
            frames1020Avg = earlyRoiValues.reduce((a, b) => a + b, 0) / earlyRoiValues.length;
            console.log(`⚠ 使用近似计算的Frames 10-20 Avg: ${frames1020Avg.toFixed(2)} (基于前${earlyRoiValues.length}个采样点)`);
          } else {
            console.log(`❌ 无法计算Frames 10-20 Avg`);
          }

          batchResults.push({
            fileName: file.name,
            threshold: threshold,
            result: result,
            frames1020Avg: frames1020Avg
          });
        } catch (error) {
          console.error(`分析文件 ${file.name} (阈值 ${threshold}) 时出错:`, error);
          batchResults.push({
            fileName: file.name,
            threshold: threshold,
            result: null,
            frames1020Avg: null,
            error: error.message
          });
        }

        // 添加小延迟避免过快请求
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      updateFileStatus(i, 'success', '完成');
    }

    progressText.textContent = '分析完成！';
    currentThresholdInfoEl.textContent = `${THRESHOLD_CONFIG.start}-${THRESHOLD_CONFIG.end} (已完成)`;
    showBatchResults();

    batchProcessing = false;
    selectFolderBtn.disabled = false;
  }

  // 分析单个文件（支持指定阈值）
  async function analyzeSingleFileWithThreshold(file, threshold) {
    // 使用当前ROI或保存的ROI参数
    let roiToUse = null;
    if (roi && roi.w > 0 && roi.h > 0) {
      roiToUse = roi;
      console.log(`分析文件时使用当前ROI (阈值: ${threshold}):`, roiToUse);
    } else if (savedROI) {
      roiToUse = savedROI;
      console.log(`分析文件时使用保存的ROI (阈值: ${threshold}):`, roiToUse);
    } else {
      // 使用默认ROI尺寸（80x160像素，归一化）
      roiToUse = { x: 0.5, y: 0.5, w: 0.2, h: 0.2 }; // 默认ROI
      console.log(`分析文件时使用默认ROI (阈值: ${threshold}):`, roiToUse);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('roi_x', String(roiToUse.x));
    formData.append('roi_y', String(roiToUse.y));
    formData.append('roi_w', String(roiToUse.w));
    formData.append('roi_h', String(roiToUse.h));
    formData.append('sample_fps', String(Number(sampleFpsEl.value || 8)));
    formData.append('methods', selectedMethods());
    formData.append('brightness_threshold', String(threshold));

    // 添加其他参数
    Object.entries(p).forEach(([key, el]) => {
      if (el && el.value !== '') {
        formData.append(key, String(el.value));
      }
    });

    const response = await fetch('http://localhost:8421/analyze', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`分析失败: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`后端返回结果 (阈值: ${threshold}):`, result);
    return result;
  }

  // 分析单个文件（兼容原有函数）
  async function analyzeSingleFile(file) {
    return analyzeSingleFileWithThreshold(file, 128); // 默认阈值128
  }

  // 更新文件状态
  function updateFileStatus(index, status, text) {
    const fileItem = document.getElementById(`batch-file-${index}`);
    if (fileItem) {
      fileItem.className = `batch-file-item ${status}`;
      const statusEl = fileItem.querySelector('.batch-file-status');
      if (statusEl) {
        statusEl.textContent = text;
      }
    }
  }

  // 显示批量分析结果
  function showBatchResults() {
    batchResultsSection.style.display = 'block';

    const totalAnalyses = batchResults.length;
    const successfulAnalyses = batchResults.filter(r => r.result !== null).length;
    const hemDetectedAnalyses = batchResults.filter(r => r.result && r.result.has_hem).length;
    const totalEvents = batchResults.reduce((sum, r) => sum + (r.result ? r.result.events.length : 0), 0);

    // 计算唯一文件数量
    const uniqueFiles = new Set(batchResults.map(r => r.fileName)).size;

    const summaryHTML = `
      <div class="batch-stat">
        <span class="batch-stat-label">视频文件数:</span>
        <span class="batch-stat-value">${uniqueFiles}</span>
      </div>
      <div class="batch-stat">
        <span class="batch-stat-label">总分析次数:</span>
        <span class="batch-stat-value">${totalAnalyses}</span>
      </div>
      <div class="batch-stat">
        <span class="batch-stat-label">成功分析:</span>
        <span class="batch-stat-value">${successfulAnalyses}</span>
      </div>
      <div class="batch-stat">
        <span class="batch-stat-label">检测到HEM:</span>
        <span class="batch-stat-value">${hemDetectedAnalyses}</span>
      </div>
      <div class="batch-stat">
        <span class="batch-stat-label">总事件数:</span>
        <span class="batch-stat-value">${totalEvents}</span>
      </div>
    `;

    document.getElementById('batchSummaryContent').innerHTML = summaryHTML;
    statusEl.textContent = `批量分析完成: ${successfulAnalyses}/${totalAnalyses} 成功`;
  }

  // 导出MD文件按钮点击事件
  exportBtn.addEventListener('click', () => {
    if (batchResults.length === 0) {
      alert('没有可导出的结果');
      return;
    }

    const markdownContent = generateMarkdownReport();
    downloadMarkdown(markdownContent, `HEM分析报告_${new Date().toISOString().slice(0, 10)}.md`);
  });

  // 导出CSV文件按钮点击事件
  exportCSVBtn.addEventListener('click', () => {
    if (batchResults.length === 0) {
      alert('没有可导出的结果');
      return;
    }

    const csvContent = generateCSVReport();
    downloadCSV(csvContent, `HEM分析数据_${new Date().toISOString().slice(0, 10)}.csv`);
  });

  // 生成Markdown报告
  function generateMarkdownReport() {
    let markdown = '# HEM 批量分析报告\n\n';
    markdown += `**生成时间**: ${new Date().toLocaleString()}\n\n`;

    const totalAnalyses = batchResults.length;
    const successfulAnalyses = batchResults.filter(r => r.result !== null).length;
    const hemDetectedAnalyses = batchResults.filter(r => r.result && r.result.has_hem).length;
    const uniqueFiles = new Set(batchResults.map(r => r.fileName)).size;

    markdown += '## 统计摘要\n\n';
    markdown += `- **视频文件数**: ${uniqueFiles}\n`;
    markdown += `- **总分析次数**: ${totalAnalyses}\n`;
    markdown += `- **成功分析**: ${successfulAnalyses}\n`;
    markdown += `- **检测到HEM**: ${hemDetectedAnalyses}\n`;
    markdown += `- **成功率**: ${((successfulAnalyses / totalAnalyses) * 100).toFixed(1)}%\n`;
    markdown += `- **测试阈值范围**: ${THRESHOLD_CONFIG.start}-${THRESHOLD_CONFIG.end} (步长${THRESHOLD_CONFIG.step})\n\n`;

    markdown += '## 详细结果\n\n';
    markdown += '| 文件名 | HEM预测 | 高亮度像素阈值 | ROI宽度(px) | ROI高度(px) | 蓝色最大值 | 蓝色平均值 | 黄色最大值 | 黄色平均值 | 第10-20帧平均灰度值 | 事件数 | 置信度 |\n';
    markdown += '|--------|---------|----------------|-----------|-----------|-----------|-----------|-----------|-----------|-----------------------|--------|--------|\n';

    // 按文件名和阈值排序
    const sortedResults = [...batchResults].sort((a, b) => {
      if (a.fileName !== b.fileName) return a.fileName.localeCompare(b.fileName);
      return (a.threshold || 0) - (b.threshold || 0);
    });

    sortedResults.forEach((item) => {
      const fileName = item.fileName;
      const threshold = item.threshold || '-';

      if (item.result) {
        // 计算所有统计值
        const {
          blueMax, blueAvg,
          yellowMax, yellowAvg,
          roiWidth, roiHeight,
          hemPrediction
        } = calculateStatValues(item.result);

        const eventCount = item.result.events.length;

        // 使用我们记录的Frames 10-20 Avg数据
        const frames1020Avg = item.frames1020Avg || 0;
        const grayscaleStr = frames1020Avg.toFixed(2);

        // 使用预测结果替代原有的HEM检测结果
        const hemStatus = hemPrediction.结果值 === 1 ? '✓' : '✗';
        const blueMaxStr = blueMax.toFixed(2);
        const blueAvgStr = blueAvg.toFixed(2);
        const yellowMaxStr = yellowMax.toFixed(1);
        const yellowAvgStr = yellowAvg.toFixed(1);
        const confidenceStr = (hemPrediction.预测置信度 * 100).toFixed(1) + '%';

        markdown += `| ${fileName} | ${hemStatus} | ${threshold} | ${roiWidth} | ${roiHeight} | ${blueMaxStr} | ${blueAvgStr} | ${yellowMaxStr}% | ${yellowAvgStr}% | ${grayscaleStr} | ${eventCount} | ${confidenceStr} |\n`;
      } else {
        markdown += `| ${fileName} | ✗ | ${threshold} | - | - | - | - | - | - | 0.00 | 0 | 0% |\n`;
      }
    });

    return markdown;
  }

  // 计算前10帧平均灰度值
  function calculateFirst10FramesAvgGrayscale(result) {
    if (!result.series || result.series.length === 0) {
      return 0.0;
    }

    // 取前10帧数据
    const first10Frames = result.series.slice(0, Math.min(10, result.series.length));

    // 计算每帧的灰度值估计：(ROI值 + 高亮度像素比例 * 100) / 2
    let totalGrayscale = 0.0;
    let validFrames = 0;

    first10Frames.forEach(frame => {
      const roiValue = frame.roi || 0;           // ROI灰度值
      const highRatio = frame.high_ratio || 0;   // 高亮度像素比例
      const yellowValue = highRatio * 100;       // 转换为百分比

      // 简单的灰度值计算：(ROI值 + 黄色值) / 2
      const grayscale = (roiValue + yellowValue) / 2;
      totalGrayscale += grayscale;
      validFrames++;
    });

    return validFrames > 0 ? totalGrayscale / validFrames : 0.0;
  }

  // 计算蓝色和黄色曲线的统计值
  function calculateStatValues(result) {
    console.log('calculateStatValues 调用，result:', result);

    if (!result.series || result.series.length === 0) {
      console.log('没有series数据，返回默认值');
      return {
        blueMax: 0, blueAvg: 0,
        yellowMax: 0, yellowAvg: 0,
        roiWidth: 0, roiHeight: 0,
        hemPrediction: { 结果值: 0, 预测置信度: 0, ROI尺寸提示: '' }
      };
    }

    console.log('series长度:', result.series.length);
    console.log('第一条series数据:', result.series[0]);

    const roi = result.series.map(p => p.roi);
    console.log('roi数据长度:', roi.length);

    // 计算蓝色曲线（当前帧ROI均值 - 历史均值）
    const d1 = new Array(roi.length).fill(0);
    let acc = 0;
    for (let i = 0; i < roi.length; i++) {
      if (i === 0) {
        d1[i] = 0;
        acc += roi[i];
        continue;
      }
      const prevMean = acc / i;
      d1[i] = roi[i] - prevMean;
      acc += roi[i];
    }

    // 黄色曲线（ROI中高亮度像素占比）
    const yellowData = result.series.map(p => p.high_ratio || 0);

    // 计算统计值
    const blueMax = Math.max(...d1);
    const blueAvg = d1.reduce((sum, val) => sum + val, 0) / d1.length;

    const yellowMax = Math.max(...yellowData);
    const yellowAvg = yellowData.reduce((sum, val) => sum + val, 0) / yellowData.length;

    // 获取ROI尺寸信息，优先使用当前设置的ROI
    const currentRoiWidth = Number(roiWidthEl?.value) || 80;
    const currentRoiHeight = Number(roiHeightEl?.value) || 160;

    // 获取当前分析使用的高亮度像素阈值
    const brightnessThreshold = result.brightness_threshold || 128;

    // 计算前10帧平均灰度值
    const first10FramesAvgGrayscale = calculateFirst10FramesAvgGrayscale(result);

    // 使用预测函数判断HEM结果
    const hemPrediction = calculateHEMResult(
      brightnessThreshold,
      currentRoiWidth,
      currentRoiHeight,
      blueMax,
      blueAvg,
      yellowMax,
      yellowAvg
    );

    console.log('ROI尺寸计算:', {
      currentRoiWidth,
      currentRoiHeight,
      brightnessThreshold,
      seriesLength: result.series.length,
      roiFirstVal: roi[0],
      d1Length: d1.length,
      blueMax,
      blueAvg,
      yellowMax,
      yellowAvg,
      hemPrediction
    });

    return {
      blueMax: isNaN(blueMax) ? 0 : blueMax,
      blueAvg: isNaN(blueAvg) ? 0 : blueAvg,
      yellowMax: isNaN(yellowMax) ? 0 : yellowMax,
      yellowAvg: isNaN(yellowAvg) ? 0 : yellowAvg,
      first10FramesAvgGrayscale: isNaN(first10FramesAvgGrayscale) ? 0 : first10FramesAvgGrayscale,
      roiWidth: currentRoiWidth,
      roiHeight: currentRoiHeight,
      hemPrediction: hemPrediction
    };
  }

  // HEM结果预测函数（基于您提供的Python函数改写为JavaScript版本）
  function calculateHEMResult(高亮度像素阈值, ROI宽度_px, ROI高度_px, 蓝色最大值, 蓝色平均值, 黄色最大值, 黄色平均值) {
    // 1. 模型适配性检查（当前模型基于ROI=80px×160px训练）
    const target_roi_width = 80;
    const target_roi_height = 160;
    let roi_warning = "";
    if (ROI宽度_px !== target_roi_width || ROI高度_px !== target_roi_height) {
      roi_warning = `警告：当前模型基于ROI=${target_roi_width}px×${target_roi_height}px训练，` +
                   `输入的ROI=${ROI宽度_px}px×${ROI高度_px}px可能导致预测偏差`;
    }

    // 2. 模型核心参数（基于675条数据训练得到的最优权重和统计值）
    // 特征重要性权重（蓝色相关特征为核心）
    const feature_weights = {
      "蓝色平均值": 0.5388,
      "蓝色最大值": 0.3956,
      "黄色最大值": 0.0333,
      "黄色平均值": 0.0322,
      "高亮度像素阈值": 0.0001  // 该参数相关性接近0，权重设置为极小值
    };

    // 各特征的统计基准值（用于标准化输入，消除量纲影响）
    const feature_baseline = {
      "蓝色平均值": { 均值: 1.46, 标准差: 2.04 },
      "蓝色最大值": { 均值: 36.84, 标准差: 9.00 },
      "黄色最大值": { 均值: 51.52, 标准差: 41.31 },
      "黄色平均值": { 均值: 29.55, 标准差: 28.20 },
      "高亮度像素阈值": { 均值: 130.00, 标准差: 43.27 }
    };

    // 3. 输入值标准化（将原始输入转换为模型可计算的标准值）
    const standardizeValue = (raw_value, feature_name) => {
      const baseline = feature_baseline[feature_name];
      return (raw_value - baseline.均值) / baseline.标准差;
    };

    // 逐个标准化所有输入参数
    const 蓝色平均值_标准化 = standardizeValue(蓝色平均值, "蓝色平均值");
    const 蓝色最大值_标准化 = standardizeValue(蓝色最大值, "蓝色最大值");
    const 黄色最大值_标准化 = standardizeValue(黄色最大值, "黄色最大值");
    const 黄色平均值_标准化 = standardizeValue(黄色平均值, "黄色平均值");
    const 高亮度阈值_标准化 = standardizeValue(高亮度像素阈值, "高亮度像素阈值");

    // 4. 计算预测得分（加权求和得到核心判断依据）
    const prediction_score = (
      feature_weights["蓝色平均值"] * 蓝色平均值_标准化 +
      feature_weights["蓝色最大值"] * 蓝色最大值_标准化 +
      feature_weights["黄色最大值"] * 黄色最大值_标准化 +
      feature_weights["黄色平均值"] * 黄色平均值_标准化 +
      feature_weights["高亮度像素阈值"] * 高亮度阈值_标准化
    );

    // 5. 结果判断（基于训练数据得到的最优阈值0.0587）
    const result = prediction_score >= 0.0587 ? 1 : 0;

    // 6. 计算置信度（通过sigmoid函数转换为0-1的概率值）
    const confidence = 1 / (1 + Math.exp(-prediction_score));
    const roundedConfidence = Math.round(confidence * 10000) / 10000; // 保留4位小数

    // 7. 返回结果（包含核心结果、置信度和警告信息）
    return {
      结果值: result,
      预测置信度: roundedConfidence,
      ROI尺寸提示: roi_warning,
      预测得分: prediction_score
    };
  }

  // 生成CSV报告
  function generateCSVReport() {
    // CSV头部信息
    let csv = 'HEM批量分析数据导出\n';
    csv += `导出时间,${new Date().toLocaleString()}\n\n`;

    // 统计摘要
    const totalAnalyses = batchResults.length;
    const successfulAnalyses = batchResults.filter(r => r.result !== null).length;
    const hemDetectedAnalyses = batchResults.filter(r => r.result && r.result.has_hem).length;
    const totalEvents = batchResults.reduce((sum, r) => sum + (r.result ? r.result.events.length : 0), 0);
    const uniqueFiles = new Set(batchResults.map(r => r.fileName)).size;

    csv += '统计摘要\n';
    csv += `视频文件数,${uniqueFiles}\n`;
    csv += `总分析次数,${totalAnalyses}\n`;
    csv += `成功分析,${successfulAnalyses}\n`;
    csv += `检测到HEM,${hemDetectedAnalyses}\n`;
    csv += `成功率,${((successfulAnalyses / totalAnalyses) * 100).toFixed(1)}%\n`;
    csv += `总事件数,${totalEvents}\n`;
    csv += `阈值范围,${THRESHOLD_CONFIG.start}-${THRESHOLD_CONFIG.end} (步长${THRESHOLD_CONFIG.step})\n\n`;

    // 详细数据表头
    csv += '详细数据\n';
    csv += '文件名,HEM预测结果,高亮度像素阈值,ROI宽度(px),ROI高度(px),蓝色最大值,蓝色平均值,黄色最大值,黄色平均值,第10-20帧平均灰度值,事件数,预测置信度,ROI尺寸提示,分析状态\n';

    // 按文件名和阈值排序
    const sortedResults = [...batchResults].sort((a, b) => {
      if (a.fileName !== b.fileName) return a.fileName.localeCompare(b.fileName);
      return (a.threshold || 0) - (b.threshold || 0);
    });

    // 详细数据行
    console.log('=== 开始处理批量结果导出 ===');
    console.log(`总共 ${sortedResults.length} 条结果`);

    sortedResults.forEach((item, index) => {
      const fileName = item.fileName.replace(/,/g, '，'); // 替换CSV中的逗号
      const threshold = item.threshold || '';

      console.log(`[${index + 1}/${sortedResults.length}] 处理结果: ${fileName}, 阈值: ${threshold}`);
      console.log(`  - 有结果: ${!!item.result}`);
      console.log(`  - 错误信息: ${item.error || '无'}`);

      if (item.result) {
        console.log(`  - result类型: ${typeof item.result}`);
        console.log(`  - result.has_hem: ${item.result.has_hem}`);
        console.log(`  - result.events: ${JSON.stringify(item.result.events)}`);
        console.log(`  - result.series存在: ${!!item.result.series}`);
        console.log(`  - result.series长度: ${item.result.series?.length || 0}`);

        if (item.result.series && item.result.series.length > 0) {
          console.log(`  - 第一条series: ${JSON.stringify(item.result.series[0])}`);
          console.log(`  - 最后一条series: ${JSON.stringify(item.result.series[item.result.series.length - 1])}`);
        }

        const eventCount = item.result.events?.length || 0;

        // 计算所有统计值
        const stats = calculateStatValues(item.result);
        console.log(`  - 统计结果:`, stats);

        const {
          blueMax, blueAvg,
          yellowMax, yellowAvg,
          roiWidth, roiHeight,
          hemPrediction
        } = stats;

        // 使用我们记录的Frames 10-20 Avg数据
        const frames1020Avg = item.frames1020Avg || 0;
        const grayscaleStr = isNaN(frames1020Avg) || frames1020Avg === 0 ? '0.00' : frames1020Avg.toFixed(2);

        // 使用预测结果替代原有的HEM检测结果
        const hemStatus = hemPrediction.结果值 === 1 ? '检测到HEM' : '未检测到HEM';
        const status = '成功';

        // 检查统计值是否为有效数字
        const blueMaxStr = isNaN(blueMax) || blueMax === 0 ? '0.00' : blueMax.toFixed(2);
        const blueAvgStr = isNaN(blueAvg) || blueAvg === 0 ? '0.00' : blueAvg.toFixed(2);
        const yellowMaxStr = isNaN(yellowMax) || yellowMax === 0 ? '0.0' : yellowMax.toFixed(1);
        const yellowAvgStr = isNaN(yellowAvg) || yellowAvg === 0 ? '0.0' : yellowAvg.toFixed(1);
        const confidenceStr = (hemPrediction.预测置信度 * 100).toFixed(1) + '%';
        const roiWarningStr = hemPrediction.ROI尺寸提示 || '';

        console.log(`  - 最终输出值: 预测结果=${hemStatus}, 置信度=${confidenceStr}, blueMax=${blueMaxStr}, blueAvg=${blueAvgStr}, yellowMax=${yellowMaxStr}, yellowAvg=${yellowAvgStr}, Frames 10-20 Avg=${grayscaleStr}, 事件数=${eventCount}`);

        csv += `${fileName},${hemStatus},${threshold},${roiWidth},${roiHeight},${blueMaxStr},${blueAvgStr},${yellowMaxStr},${yellowAvgStr},${grayscaleStr},${eventCount},${confidenceStr},"${roiWarningStr}",${status}\n`;
      } else {
        console.log(`  - 分析失败，使用默认值`);
        csv += `${fileName},未检测到HEM,${threshold},-,-,-,-,-,-,0.00,0,0%,,失败\n`;
      }
    });

    console.log('=== 批量结果处理完成 ===');

    return csv;
  }

  // 下载Markdown文件
  function downloadMarkdown(content, filename) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // 下载CSV文件
  function downloadCSV(content, filename) {
    // 添加BOM以支持中文显示
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

})();






















