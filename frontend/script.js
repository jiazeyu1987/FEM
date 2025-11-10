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
  const sampleFpsEl = document.getElementById('sampleFps');
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
    // timeline shading thresholds (frontend-only)
    rise_thresh: document.getElementById('p_rise_thresh'),
    fall_thresh: document.getElementById('p_fall_thresh'),
  };

  let roi = null; // normalized {x,y,w,h}
  let dragging = false; let start = null; let rectPx = null;
  let analyzedXs = []; let analyzedEvents = []; let analyzedSeries = []; let analyzedBaseline = 0;
  let shadedIntervals = []; // [{start, end}] regions to shade on timeline
  let lastBlueJudge = null;
  const timelineState = { fullMin: 0, fullMax: 0, min: 0, max: 0 };
  let zoom = 1.0;
  let panX = 0, panY = 0; // videoWrap translation in panel pixels
  let isPanning = false; let panStart = {x:0,y:0}; let panOrigin = {x:0,y:0};
  let roiVisible = true;
  const chartState = { showBlue: (showBlueEl? showBlueEl.checked : true), showYellow: (showYellowEl? showYellowEl.checked : true), yZoom: 1, padLeft: 56 };

  // Load video preview
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
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
      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth = 2;
      ctx.strokeRect(rectPx.x, rectPx.y, rectPx.w, rectPx.h);
      ctx.fillStyle = 'rgba(79,195,247,0.15)';
      ctx.fillRect(rectPx.x, rectPx.y, rectPx.w, rectPx.h);
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
    if (e.button !== 0) return; // only left button draws ROI
    const p = localPos(e);
    start = {x: p.x, y: p.y};
    dragging = true; rectPx = {x:start.x, y:start.y, w:0, h:0};
    drawOverlay();
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
      analyzeBtn.disabled = !fileInput.files?.[0];
      statusEl.textContent = `ROI = x:${roi.x.toFixed(3)}, y:${roi.y.toFixed(3)}, w:${roi.w.toFixed(3)}, h:${roi.h.toFixed(3)}`;
    }
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
      fd.append('roi_x', String(roi.x));
      fd.append('roi_y', String(roi.y));
      fd.append('roi_w', String(roi.w));
      fd.append('roi_h', String(roi.h));
      fd.append('sample_fps', String(Number(sampleFpsEl.value || 8)));
      fd.append('methods', selectedMethods());
      // attach parameters (optional)
      Object.entries(p).forEach(([key, el])=>{ if (el && el.value !== '') fd.append(key, String(el.value)); });

      const resp = await fetch('http://localhost:8000/analyze', { method:'POST', body: fd });
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
    renderEventsTable([]);
    return;
  }

  const xs = series.map(p=>p.t);
  const roi = series.map(p=>p.roi);
  const ref = series.map(p=>p.ref);
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
    setLabelTextForInput('showYellow', 'Yellow d(\\u0394v)');

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

    // labels for meaning
    let tx = padLeft + 4; let ty = padTop - 2; ty = Math.max(14, ty);
    ctx.font = '12px sans-serif';
    if (chartState.showBlue){ ctx.fillStyle = '#93c5fd'; ctx.fillText('蓝: 当前帧ROI均值 − 历史均值  X=时间(s)  Y=差值', tx, 14); }
    if (chartState.showYellow){ ctx.fillStyle = '#fbbf24'; ctx.fillText('黄: 上述差值的一阶差分  X=时间(s)  Y=变化量', tx, 28); }

    // current time line
    if (!isNaN(video.currentTime)){
      const ct = video.currentTime; if (ct>=minX && ct<=maxX){ const x=x2px(ct); ctx.strokeStyle='#60a5fa'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x, padTop); ctx.lineTo(x, H-padBottom); ctx.stroke(); }
    }

    // expose padLeft for wheel hit-test
    chartState.padLeft = padLeft;
  }

  // toggles
  function syncToggles(){ chartState.showBlue = !!(showBlueEl?.checked ?? true); chartState.showYellow = !!(showYellowEl?.checked ?? true); rerenderAll(); }
  showBlueEl?.addEventListener('change', syncToggles);
  showYellowEl?.addEventListener('change', syncToggles);

})();






















blueMaxThreshEl?.addEventListener('input', ()=>{ updateBlueJudge(); });
