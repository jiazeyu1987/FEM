// HEM Curve Data Viewer - Main Application Script

// Global State
const app = {
    curveData: [],
    filteredData: [],
    chartInstances: new Map(),
    virtualScrolling: {
        active: false,
        visibleStartIndex: 0,
        visibleEndIndex: 0,
        renderedCharts: new Set(),
        itemHeight: 450,
        containerHeight: 0
    },
    viewSettings: {
        zoom: 1.0,
        showWhite: true,
        showBlue: true,
        showYellow: true,
        showPink: true,
        showPurple: true
    },
    isLoading: false,
    currentFile: null
};

// DOM Elements
const elements = {
    // File upload
    dropZone: null,
    fileInput: null,
    loadBtn: null,

    // File info
    fileInfo: null,
    fileName: null,
    videoCount: null,
    exportTime: null,

    // Controls
    curveControls: null,
    viewControls: null,
    showWhite: null,
    showBlue: null,
    showYellow: null,
    showPink: null,
    showPurple: null,
    zoomInBtn: null,
    zoomOutBtn: null,
    resetZoomBtn: null,
    exportImageBtn: null,

    // Statistics
    statistics: null,
    totalCharts: null,
    visibleCharts: null,
    zoomLevel: null,

    // Main content
    loadingIndicator: null,
    chartsContainer: null,
    emptyState: null,
    chartsGrid: null,
    chartRange: null,

    // Status
    status: null
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 HEM Curve Viewer initializing...');

    // Cache DOM elements
    cacheElements();

    // Setup event listeners
    setupEventListeners();

    // Update status
    updateStatus('准备就绪 - 请加载曲线数据文件');

    console.log('✅ HEM Curve Viewer initialized successfully');
});

// Cache all DOM elements
function cacheElements() {
    // File upload elements
    elements.dropZone = document.getElementById('dropZone');
    elements.fileInput = document.getElementById('fileInput');
    elements.loadBtn = document.getElementById('loadBtn');

    // File info elements
    elements.fileInfo = document.getElementById('fileInfo');
    elements.fileName = document.getElementById('fileName');
    elements.videoCount = document.getElementById('videoCount');
    elements.exportTime = document.getElementById('exportTime');

    // Control elements
    elements.curveControls = document.getElementById('curveControls');
    elements.viewControls = document.getElementById('viewControls');
    elements.showWhite = document.getElementById('showWhite');
    elements.showBlue = document.getElementById('showBlue');
    elements.showYellow = document.getElementById('showYellow');
    elements.showPink = document.getElementById('showPink');
    elements.showPurple = document.getElementById('showPurple');
    elements.zoomInBtn = document.getElementById('zoomInBtn');
    elements.zoomOutBtn = document.getElementById('zoomOutBtn');
    elements.resetZoomBtn = document.getElementById('resetZoomBtn');
    elements.exportImageBtn = document.getElementById('exportImageBtn');

    // Statistics elements
    elements.statistics = document.getElementById('statistics');
    elements.totalCharts = document.getElementById('totalCharts');
    elements.visibleCharts = document.getElementById('visibleCharts');
    elements.zoomLevel = document.getElementById('zoomLevel');

    // Main content elements
    elements.loadingIndicator = document.getElementById('loadingIndicator');
    elements.chartsContainer = document.getElementById('chartsContainer');
    elements.emptyState = document.getElementById('emptyState');
    elements.chartsGrid = document.getElementById('chartsGrid');
    elements.chartRange = document.getElementById('chartRange');

    // Status element
    elements.status = document.getElementById('status');
}

// Setup all event listeners
function setupEventListeners() {
    // File upload events
    elements.loadBtn?.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput?.addEventListener('change', handleFileSelect);

    // Drag and drop events
    if (elements.dropZone) {
        elements.dropZone.addEventListener('dragover', handleDragOver);
        elements.dropZone.addEventListener('dragleave', handleDragLeave);
        elements.dropZone.addEventListener('drop', handleFileDrop);
        elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    }

    // Curve visibility controls
    [elements.showWhite, elements.showBlue, elements.showYellow, elements.showPink, elements.showPurple]
        .forEach((checkbox, index) => {
            if (checkbox) {
                checkbox.addEventListener('change', () => handleCurveVisibilityChange(index));
            }
        });

    // Zoom controls
    elements.zoomInBtn?.addEventListener('click', () => handleZoom(1.2));
    elements.zoomOutBtn?.addEventListener('click', () => handleZoom(0.8));
    elements.resetZoomBtn?.addEventListener('click', () => handleZoom(1.0, true));

    // Export controls
    elements.exportImageBtn?.addEventListener('click', handleExportImage);

    // Charts grid scroll event (for virtual scrolling)
    if (elements.chartsGrid) {
        elements.chartsGrid.addEventListener('scroll', handleChartScroll);
    }

    // Window resize event
    window.addEventListener('resize', handleWindowResize);
}

// File Handling Functions
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        loadFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    elements.dropZone?.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    elements.dropZone?.classList.remove('drag-over');
}

function handleFileDrop(event) {
    event.preventDefault();
    elements.dropZone?.classList.remove('drag-over');

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        loadFile(files[0]);
    }
}

async function loadFile(file) {
    console.log('📁 Loading file:', file.name);

    // Update UI state
    app.isLoading = true;
    app.currentFile = file;
    showLoading(true);
    updateStatus(`正在加载文件: ${file.name}`);

    try {
        const fileContent = await readFileContent(file);
        let parsedData;

        if (file.name.toLowerCase().endsWith('.json')) {
            parsedData = parseJSONFile(fileContent);
        } else if (file.name.toLowerCase().endsWith('.csv')) {
            parsedData = parseCSVFile(fileContent);
        } else {
            throw new Error('不支持的文件格式，请使用 JSON 或 CSV 文件');
        }

        // Validate and store data
        if (validateCurveData(parsedData)) {
            app.curveData = parsedData;
            app.filteredData = [...parsedData];

            // Update UI
            updateFileInfo(file, parsedData);
            showChartsInterface();
            renderAllCharts();
            updateStatistics();

            updateStatus(`✅ 成功加载 ${parsedData.length} 个视频的曲线数据`);
            console.log('✅ File loaded successfully:', {
                fileName: file.name,
                videoCount: parsedData.length,
                totalDataPoints: parsedData.reduce((sum, video) => sum + (video.curves?.time?.length || 0), 0)
            });
        } else {
            throw new Error('文件数据格式无效或缺少必要的曲线数据');
        }

    } catch (error) {
        console.error('❌ Error loading file:', error);
        updateStatus(`❌ 加载失败: ${error.message}`);
        showError(`文件加载失败: ${error.message}`);
    } finally {
        app.isLoading = false;
        showLoading(false);
    }
}

function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = () => reject(new Error('文件读取失败'));

        // Handle UTF-8 BOM for CSV files
        if (file.name.toLowerCase().endsWith('.csv')) {
            reader.readAsText(file, 'UTF-8');
        } else {
            reader.readAsText(file);
        }
    });
}

function parseJSONFile(content) {
    try {
        const data = JSON.parse(content);

        // Handle different JSON formats
        if (data.videos && Array.isArray(data.videos)) {
            // Standard export format
            return data.videos.map(video => ({
                fileName: video.fileName || video.videoName || 'Unknown',
                videoId: video.videoId || generateId(),
                duration: video.duration || 0,
                sampleFps: video.sampleFps || 8,
                curves: video.curves || {}
            }));
        } else if (Array.isArray(data)) {
            // Array of videos format
            return data.map(video => ({
                fileName: video.fileName || video.videoName || 'Unknown',
                videoId: video.videoId || generateId(),
                duration: video.duration || 0,
                sampleFps: video.sampleFps || 8,
                curves: video.curves || {}
            }));
        } else {
            throw new Error('JSON 格式不正确');
        }
    } catch (error) {
        throw new Error(`JSON 解析失败: ${error.message}`);
    }
}

function parseCSVFile(content) {
    try {
        // Remove BOM if present
        content = content.replace(/^\uFEFF/, '');

        const lines = content.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV 文件内容不足');
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const videoMap = new Map();

        // Process data rows
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length < headers.length) continue;

            const fileName = values[0];
            const time = parseFloat(values[1]) || 0;
            const white = parseFloat(values[2]) || 0;
            const blue = parseFloat(values[3]) || 0;
            const yellow = parseFloat(values[4]) || 0;
            const pink = parseFloat(values[5]) || 0;
            const purple = parseFloat(values[6]) || 0;

            if (!videoMap.has(fileName)) {
                videoMap.set(fileName, {
                    fileName: fileName,
                    videoId: generateId(),
                    duration: 0,
                    sampleFps: 8,
                    curves: {
                        time: [],
                        white: [],
                        blue: [],
                        yellow: [],
                        pink: [],
                        purple: []
                    }
                });
            }

            const video = videoMap.get(fileName);
            video.curves.time.push(time);
            video.curves.white.push(white);
            video.curves.blue.push(blue);
            video.curves.yellow.push(yellow);
            video.curves.pink.push(pink);
            video.curves.purple.push(purple);

            // Update duration
            video.duration = Math.max(video.duration, time);
        }

        const result = Array.from(videoMap.values());

        if (result.length === 0) {
            throw new Error('CSV 文件中没有有效的数据');
        }

        return result;

    } catch (error) {
        throw new Error(`CSV 解析失败: ${error.message}`);
    }
}

function validateCurveData(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return false;
    }

    return data.every(video => {
        const curves = video.curves;
        if (!curves) return false;

        const requiredCurves = ['time', 'white', 'blue', 'yellow', 'pink', 'purple'];
        const hasAllCurves = requiredCurves.every(curve =>
            Array.isArray(curves[curve]) && curves[curve].length > 0
        );

        if (!hasAllCurves) return false;

        // Check that all curve arrays have the same length
        const lengths = requiredCurves.map(curve => curves[curve].length);
        const firstLength = lengths[0];
        return lengths.every(length => length === firstLength);
    });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// UI Update Functions
function showLoading(show) {
    if (elements.loadingIndicator) {
        elements.loadingIndicator.style.display = show ? 'flex' : 'none';
    }
}

function showChartsInterface() {
    if (elements.emptyState) elements.emptyState.style.display = 'none';
    if (elements.chartsContainer) elements.chartsContainer.style.display = 'flex';
    if (elements.fileInfo) elements.fileInfo.style.display = 'flex';
    if (elements.curveControls) elements.curveControls.style.display = 'flex';
    if (elements.viewControls) elements.viewControls.style.display = 'flex';
    if (elements.statistics) elements.statistics.style.display = 'flex';
}

function updateFileInfo(file, data) {
    if (elements.fileName) {
        elements.fileName.textContent = file.name;
    }

    if (elements.videoCount) {
        elements.videoCount.textContent = data.length;
    }

    if (elements.exportTime) {
        elements.exportTime.textContent = new Date().toLocaleString('zh-CN');
    }
}

function updateStatistics() {
    const totalCharts = app.filteredData.length;
    const visibleCharts = Math.min(
        totalCharts,
        Math.ceil(elements.chartsGrid?.clientHeight / app.virtualScrolling.itemHeight || 1)
    );

    if (elements.totalCharts) {
        elements.totalCharts.textContent = totalCharts;
    }

    if (elements.visibleCharts) {
        elements.visibleCharts.textContent = visibleCharts;
    }

    if (elements.zoomLevel) {
        elements.zoomLevel.textContent = Math.round(app.viewSettings.zoom * 100) + '%';
    }

    if (elements.chartRange) {
        if (totalCharts === visibleCharts) {
            elements.chartRange.textContent = '显示所有图表';
        } else {
            const start = app.virtualScrolling.visibleStartIndex + 1;
            const end = Math.min(
                app.virtualScrolling.visibleEndIndex,
                totalCharts
            );
            elements.chartRange.textContent = `显示 ${start}-${end} / ${totalCharts}`;
        }
    }
}

function updateStatus(message) {
    if (elements.status) {
        elements.status.innerHTML = `<span>${message}</span>`;
    }
}

function showError(message) {
    updateStatus(`❌ ${message}`);

    // Also show as an alert for critical errors
    setTimeout(() => {
        alert(message);
    }, 100);
}

// Chart Rendering Functions
function renderAllCharts() {
    if (!elements.chartsGrid || app.filteredData.length === 0) {
        return;
    }

    console.log('🎨 Rendering charts for', app.filteredData.length, 'videos');

    // Clear existing charts
    clearCharts();

    // Setup virtual scrolling if needed
    if (app.filteredData.length > 20) {
        setupVirtualScrolling();
    } else {
        // Render all charts directly for small datasets
        renderChartsDirectly();
    }
}

function clearCharts() {
    if (elements.chartsGrid) {
        elements.chartsGrid.innerHTML = '';
    }

    app.chartInstances.clear();
    app.virtualScrolling.renderedCharts.clear();
}

function renderChartsDirectly() {
    app.filteredData.forEach((videoData, index) => {
        const chartElement = createChartElement(videoData, index);
        elements.chartsGrid?.appendChild(chartElement);
    });

    updateStatistics();
}

function setupVirtualScrolling() {
    if (!elements.chartsGrid) return;

    const containerHeight = elements.chartsGrid.clientHeight || 600;
    const visibleChartCount = Math.ceil(containerHeight / app.virtualScrolling.itemHeight);

    // Set grid container height for scroll
    const totalHeight = app.filteredData.length * app.virtualScrolling.itemHeight;
    elements.chartsGrid.style.height = `${containerHeight}px`;
    elements.chartsGrid.style.minHeight = `${containerHeight}px`;

    // Create placeholder divs for scroll space
    elements.chartsGrid.innerHTML = '';
    const scrollSpacer = document.createElement('div');
    scrollSpacer.style.height = `${totalHeight}px`;
    scrollSpacer.style.position = 'relative';
    elements.chartsGrid.appendChild(scrollSpacer);

    // Update virtual scrolling state
    app.virtualScrolling = {
        ...app.virtualScrolling,
        active: true,
        containerHeight: containerHeight,
        visibleStartIndex: 0,
        visibleEndIndex: visibleChartCount
    };

    // Initial render
    renderVisibleCharts();

    console.log('✅ Virtual scrolling setup complete', {
        totalCharts: app.filteredData.length,
        visibleCount: visibleChartCount,
        containerHeight: containerHeight
    });
}

function renderVisibleCharts() {
    if (!app.virtualScrolling.active) return;

    const { visibleStartIndex, visibleEndIndex, itemHeight } = app.virtualScrolling;
    const scrollSpacer = elements.chartsGrid?.querySelector('div');

    if (!scrollSpacer) return;

    // Clear previous charts from spacer
    const existingCharts = scrollSpacer.querySelectorAll('.chart-item');
    existingCharts.forEach(chart => chart.remove());

    // Render visible charts
    for (let i = visibleStartIndex; i < visibleEndIndex && i < app.filteredData.length; i++) {
        const videoData = app.filteredData[i];
        const chartElement = createChartElement(videoData, i);

        // Position chart element
        chartElement.style.position = 'absolute';
        chartElement.style.top = `${i * itemHeight}px`;
        chartElement.style.left = '0';
        chartElement.style.right = '0';

        scrollSpacer.appendChild(chartElement);
        app.virtualScrolling.renderedCharts.add(i);
    }

    updateStatistics();
}

function createChartElement(videoData, index) {
    const chartItem = document.createElement('div');
    chartItem.className = 'chart-item';
    chartItem.dataset.videoIndex = index;

    // Create header
    const header = document.createElement('div');
    header.className = 'chart-header';
    header.innerHTML = `
        <h4 class="chart-title" title="${videoData.fileName}">${videoData.fileName}</h4>
        <span class="chart-duration">${videoData.duration.toFixed(1)}s</span>
    `;

    // Create canvas container
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'chart-canvas-container';

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'chart-canvas';
    canvas.width = 550;
    canvas.height = 280;

    // Store canvas reference
    app.chartInstances.set(index, canvas);

    // Assemble elements
    canvasContainer.appendChild(canvas);
    chartItem.appendChild(header);
    chartItem.appendChild(canvasContainer);

    // Render chart on canvas
    setTimeout(() => {
        renderChartOnCanvas(canvas, videoData);
    }, 0);

    return chartItem;
}

function renderChartOnCanvas(canvas, videoData) {
    const ctx = canvas.getContext('2d');
    const curves = videoData.curves;

    // Debug logging
    console.log(`🎨 Rendering chart for: ${videoData.fileName}`, {
        hasCurves: !!curves,
        timeLength: curves?.time?.length,
        whiteLength: curves?.white?.length,
        blueLength: curves?.blue?.length
    });

    if (!curves || !curves.time || curves.time.length === 0) {
        console.warn('No curve data available for:', videoData.fileName);
        return;
    }

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up drawing area with padding
    const padding = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 50
    };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Draw background
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    drawGrid(ctx, padding, chartWidth, chartHeight);

    // Calculate data ranges with safety checks
    const timeRange = [Math.min(...curves.time), Math.max(...curves.time)];
    const allValues = [
        ...curves.white, ...curves.blue, ...curves.yellow,
        ...curves.pink, ...curves.purple
    ].filter(v => isFinite(v));

    if (allValues.length === 0) {
        console.warn('No valid curve values found for:', videoData.fileName);
        return;
    }

    const valueRange = [Math.min(...allValues), Math.max(...allValues)];

    // Add padding to value range, with safety check
    const valuePadding = (valueRange[1] - valueRange[0]) * 0.1 || 10;
    valueRange[0] -= valuePadding;
    valueRange[1] += valuePadding;

    // Prevent zero range
    if (valueRange[1] - valueRange[0] < 0.001) {
        valueRange[0] -= 10;
        valueRange[1] += 10;
    }

    // Prevent zero time range
    if (timeRange[1] - timeRange[0] < 0.001) {
        timeRange[1] = timeRange[0] + 1;
    }

    console.log(`📊 Data ranges for ${videoData.fileName}:`, {
        timeRange: timeRange,
        valueRange: valueRange,
        dataPoints: curves.time.length
    });

    // Helper function to convert data coordinates to canvas coordinates
    const dataToCanvas = (time, value) => {
        // Handle edge cases
        if (!isFinite(time) || !isFinite(value)) {
            return { x: padding.left, y: padding.top + chartHeight / 2 };
        }

        // Clamp values to ranges
        const clampedTime = Math.max(timeRange[0], Math.min(timeRange[1], time));
        const clampedValue = Math.max(valueRange[0], Math.min(valueRange[1], value));

        const x = padding.left + ((clampedTime - timeRange[0]) / (timeRange[1] - timeRange[0])) * chartWidth;
        const y = padding.top + (1 - (clampedValue - valueRange[0]) / (valueRange[1] - valueRange[0])) * chartHeight;

        return { x, y };
    };

    // Draw curves with enhanced visibility
    const curveConfigs = [
        { key: 'white', color: '#ffffff', width: 2, visible: app.viewSettings.showWhite },
        { key: 'blue', color: '#4fc3f7', width: 2, visible: app.viewSettings.showBlue },
        { key: 'yellow', color: '#fbbf24', width: 2, visible: app.viewSettings.showYellow },
        { key: 'pink', color: '#f9a8d4', width: 2, visible: app.viewSettings.showPink },
        { key: 'purple', color: '#a855f7', width: 2, visible: app.viewSettings.showPurple }
    ];

    curveConfigs.forEach(config => {
        if (!config.visible || !curves[config.key] || curves[config.key].length === 0) {
            console.log(`⏭️ Skipping ${config.key} curve: visible=${config.visible}, hasData=${!!curves[config.key]}`);
            return;
        }

        console.log(`✏️ Drawing ${config.key} curve with ${curves[config.key].length} points`);

        ctx.strokeStyle = config.color;
        ctx.lineWidth = Math.max(1, config.width * app.viewSettings.zoom);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Add shadow for better visibility
        ctx.shadowColor = config.color;
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.beginPath();

        let validPoints = 0;
        for (let i = 0; i < curves.time.length; i++) {
            const time = curves.time[i];
            const value = curves[config.key][i];

            if (isFinite(time) && isFinite(value)) {
                const point = dataToCanvas(time, value);

                if (validPoints === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
                validPoints++;
            }
        }

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        if (validPoints > 1) {
            ctx.stroke();
            console.log(`✅ Successfully drew ${config.key} curve with ${validPoints} points`);
        } else {
            console.warn(`⚠️ ${config.key} curve has insufficient valid points: ${validPoints}`);
        }
    });

    // Draw axes
    drawAxes(ctx, padding, chartWidth, chartHeight, timeRange, valueRange);

    console.log(`🎨 Chart rendering completed for: ${videoData.fileName}`);
}

function drawGrid(ctx, padding, chartWidth, chartHeight) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    // Vertical grid lines (5 columns)
    for (let i = 0; i <= 5; i++) {
        const x = padding.left + (i * chartWidth) / 5;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + chartHeight);
        ctx.stroke();
    }

    // Horizontal grid lines (5 rows)
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (i * chartHeight) / 5;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
    }
}

function drawAxes(ctx, padding, chartWidth, chartHeight, timeRange, valueRange) {
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#9da0a6';
    ctx.font = '10px monospace';

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.stroke();

    // X-axis labels (time)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i <= 5; i++) {
        const time = timeRange[0] + (i * (timeRange[1] - timeRange[0])) / 5;
        const x = padding.left + (i * chartWidth) / 5;
        ctx.fillText(time.toFixed(1) + 's', x, padding.top + chartHeight + 5);
    }

    // Y-axis labels (values)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
        const value = valueRange[0] + (i * (valueRange[1] - valueRange[0])) / 5;
        const y = padding.top + chartHeight - (i * chartHeight) / 5;
        ctx.fillText(value.toFixed(0), padding.left - 5, y);
    }
}

// Event Handlers
function handleCurveVisibilityChange(curveIndex) {
    const curveNames = ['showWhite', 'showBlue', 'showYellow', 'showPink', 'showPurple'];
    const settingKeys = ['showWhite', 'showBlue', 'showYellow', 'showPink', 'showPurple'];

    app.viewSettings[settingKeys[curveIndex]] = elements[curveNames[curveIndex]]?.checked || false;

    // Re-render all charts
    reRenderCharts();

    console.log('👁️ Curve visibility changed:', app.viewSettings);
}

function handleZoom(factor, reset = false) {
    if (reset) {
        app.viewSettings.zoom = 1.0;
    } else {
        app.viewSettings.zoom = Math.max(0.5, Math.min(3.0, app.viewSettings.zoom * factor));
    }

    reRenderCharts();
    updateStatistics();

    console.log('🔍 Zoom level:', app.viewSettings.zoom);
}

function reRenderCharts() {
    // Re-render existing chart instances
    app.chartInstances.forEach((canvas, index) => {
        if (index < app.filteredData.length) {
            renderChartOnCanvas(canvas, app.filteredData[index]);
        }
    });
}

function handleChartScroll() {
    if (!app.virtualScrolling.active) return;

    const scrollTop = elements.chartsGrid.scrollTop;
    const { itemHeight, containerHeight } = app.virtualScrolling;

    const newStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight));
    const newEndIndex = Math.min(
        app.filteredData.length,
        Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    // Only re-render if the visible range changed
    if (newStartIndex !== app.virtualScrolling.visibleStartIndex ||
        newEndIndex !== app.virtualScrolling.visibleEndIndex) {

        app.virtualScrolling.visibleStartIndex = newStartIndex;
        app.virtualScrolling.visibleEndIndex = newEndIndex;

        renderVisibleCharts();
    }
}

function handleWindowResize() {
    // Debounced resize handler
    clearTimeout(app.resizeTimeout);
    app.resizeTimeout = setTimeout(() => {
        if (app.filteredData.length > 0) {
            renderAllCharts();
        }
    }, 250);
}

function handleExportImage() {
    if (app.chartInstances.size === 0) {
        showError('没有可导出的图表');
        return;
    }

    try {
        // Create a temporary canvas to combine all charts
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size (2x2 grid for export)
        canvas.width = 1200;
        canvas.height = 800;

        // White background for export
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add title
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('HEM曲线数据导出', canvas.width / 2, 40);

        ctx.font = '16px Arial';
        ctx.fillText(`文件: ${app.currentFile?.name || 'Unknown'}`, canvas.width / 2, 70);
        ctx.fillText(`导出时间: ${new Date().toLocaleString('zh-CN')}`, canvas.width / 2, 95);

        // Export each chart as image and draw on main canvas
        const charts = Array.from(app.chartInstances.values()).slice(0, 4);
        const chartSize = 250;
        const padding = 120;

        charts.forEach((chartCanvas, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            const x = padding + col * (chartSize + 50);
            const y = padding + row * (chartSize + 80) + 50;

            // Draw chart background
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(x - 10, y - 10, chartSize + 20, chartSize + 40);

            // Draw chart
            ctx.drawImage(chartCanvas, x, y, chartSize, chartSize);

            // Add chart label
            ctx.fillStyle = '#000000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            const videoIndex = Array.from(app.chartInstances.keys())[index];
            const fileName = app.filteredData[videoIndex]?.fileName || `Chart ${index + 1}`;
            ctx.fillText(fileName, x + chartSize / 2, y + chartSize + 20);
        });

        // Download the image
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `HEM曲线图表_${new Date().toISOString().slice(0, 10)}.png`;
            a.click();
            URL.revokeObjectURL(url);

            updateStatus('✅ 图表已导出为PNG图片');
        }, 'image/png');

    } catch (error) {
        console.error('❌ Export failed:', error);
        showError('导出图片失败: ' + error.message);
    }
}

// Error Handling and Cleanup
window.addEventListener('error', (event) => {
    console.error('❌ Global error:', event.error);
    updateStatus('❌ 发生错误，请查看控制台');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled promise rejection:', event.reason);
    updateStatus('❌ 异步操作失败');
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    // Clear any timeouts
    if (app.resizeTimeout) {
        clearTimeout(app.resizeTimeout);
    }
});

console.log('📄 HEM Curve Viewer script loaded');