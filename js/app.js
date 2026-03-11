document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let currentLang = 'en';
    let i18nData = {};
    let mapData = null;
    let pathEngine = null;
    let mapImage = new Image();
    let drawnPath = null;

    // --- Canvas Transform State ---
    let scale = 1;
    let minScale = 0.5;
    let maxScale = 3.0;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    // For pinch zoom
    let initialPinchDistance = null;
    let initialPinchScale = 1;

    // --- DOM Elements ---
    const titleText = document.getElementById('title-text');
    const mapContainer = document.querySelector('.map-container');
    const canvas = document.getElementById('map-canvas');
    const ctx = canvas.getContext('2d');
    const langToggle = document.getElementById('lang-toggle');
    const startLabel = document.getElementById('start-label');
    const startInput = document.getElementById('start-input');
    const destLabel = document.getElementById('dest-label');
    const destInput = document.getElementById('dest-input');
    const nodesList = document.getElementById('nodes-list');
    const navigateBtn = document.getElementById('navigate-btn');

    // --- Initialization ---
    async function init() {
        await loadI18n();
        await loadMapData();
        updateUI();
        populateDropdowns();

        if (mapData) {
            pathEngine = new window.PathfindingEngine(mapData);
        }

        await loadMapImage();
        setupCanvas();

        langToggle.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'zh' : 'en';
            updateUI();
        });

        setupCanvasInteractions();

        navigateBtn.addEventListener('click', () => {
            const startId = startInput.value;
            const destId = destInput.value;

            if (!startId || !destId) {
                alert(currentLang === 'en' ? 'Please select both start and destination.' : '请选择起点和终点。');
                return;
            }

            if (startId === destId) {
                alert(currentLang === 'en' ? 'Start and destination cannot be the same.' : '起点和终点不能相同。');
                return;
            }

            if (pathEngine) {
                drawnPath = pathEngine.findShortestPath(startId, destId);
                drawMap(); // Redraw map and path
            }
        });

        window.addEventListener('resize', () => {
            setupCanvas();
        });
    }

    // --- Map Rendering ---
    function loadMapImage() {
        return new Promise((resolve, reject) => {
            mapImage.onload = resolve;
            mapImage.onerror = reject;
            mapImage.src = 'assets/img/lvl4map.jpg';
        });
    }

    function setupCanvas() {
        if (!mapImage.complete) return;

        // Set canvas physical size to match container
        canvas.width = mapContainer.clientWidth;
        canvas.height = mapContainer.clientHeight;

        // Determine initial scale to fit map within the container
        const scaleX = canvas.width / mapImage.width;
        const scaleY = canvas.height / mapImage.height;
        minScale = Math.min(scaleX, scaleY); // Fit entirely in view

        // Set initial state
        scale = minScale;

        // Center the image
        translateX = (canvas.width - mapImage.width * scale) / 2;
        translateY = (canvas.height - mapImage.height * scale) / 2;

        drawMap();
    }

    function drawMap() {
        // Clear the entire canvas
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply transformations for pan and zoom
        ctx.setTransform(scale, 0, 0, scale, translateX, translateY);

        // Draw background map
        ctx.drawImage(mapImage, 0, 0);

        // Draw path if exists
        if (drawnPath && drawnPath.length > 0) {
            drawPath();
        }
    }

    function drawPath() {
        if (!drawnPath || drawnPath.length === 0) return;

        ctx.beginPath();

        // Native coordinates (no manual scaling, ctx handles it)
        const startX = drawnPath[0].x;
        const startY = drawnPath[0].y;

        ctx.moveTo(startX, startY);

        for (let i = 1; i < drawnPath.length; i++) {
            ctx.lineTo(drawnPath[i].x, drawnPath[i].y);
        }

        // Thick, highly visible neon blue line
        // Divide by scale so line width stays visually consistent regardless of zoom
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 6 / scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Add a glow effect
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10 / scale;

        ctx.stroke();

        // Draw start point
        ctx.beginPath();
        ctx.arc(startX, startY, 8 / scale, 0, 2 * Math.PI);
        ctx.fillStyle = '#00ff00'; // Green for start
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow
        ctx.stroke();

        // Draw end point
        const endX = drawnPath[drawnPath.length - 1].x;
        const endY = drawnPath[drawnPath.length - 1].y;

        ctx.beginPath();
        ctx.arc(endX, endY, 8 / scale, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff0000'; // Red for end
        ctx.fill();
        ctx.stroke();
    }

    // --- Interaction Mechanics (Pan & Zoom) ---
    function setupCanvasInteractions() {
        // Mouse Events
        canvas.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        // Wheel Event (Zoom)
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomAmount = e.deltaY > 0 ? 0.9 : 1.1;
            zoom(zoomAmount, e.clientX, e.clientY);
        }, { passive: false });

        // Touch Events
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length === 1) {
                // Single touch: Pan
                onPointerDown(e.touches[0]);
            } else if (e.touches.length === 2) {
                // Dual touch: Zoom
                isDragging = false;
                initialPinchDistance = getPinchDistance(e.touches);
                initialPinchScale = scale;
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1) {
                onPointerMove(e.touches[0]);
            } else if (e.touches.length === 2 && initialPinchDistance) {
                const currentDistance = getPinchDistance(e.touches);
                const zoomFactor = currentDistance / initialPinchDistance;
                const newScale = Math.min(Math.max(initialPinchScale * zoomFactor, minScale), maxScale);

                // Approximate center of pinch
                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

                // Calculate translation to zoom around the pinch center
                const rect = canvas.getBoundingClientRect();
                const mouseX = centerX - rect.left;
                const mouseY = centerY - rect.top;

                translateX = mouseX - (mouseX - translateX) * (newScale / scale);
                translateY = mouseY - (mouseY - translateY) * (newScale / scale);
                scale = newScale;

                clampTranslation();
                drawMap();
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                initialPinchDistance = null;
            }
            if (e.touches.length === 0) {
                onPointerUp();
            }
        });
    }

    function getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function onPointerDown(e) {
        isDragging = true;
        dragStartX = e.clientX - translateX;
        dragStartY = e.clientY - translateY;
    }

    function onPointerMove(e) {
        if (!isDragging) return;
        translateX = e.clientX - dragStartX;
        translateY = e.clientY - dragStartY;
        clampTranslation();
        drawMap();
    }

    function onPointerUp() {
        isDragging = false;
    }

    function zoom(factor, clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        const newScale = Math.min(Math.max(scale * factor, minScale), maxScale);

        // Adjust translation to zoom around the mouse pointer
        translateX = mouseX - (mouseX - translateX) * (newScale / scale);
        translateY = mouseY - (mouseY - translateY) * (newScale / scale);

        scale = newScale;
        clampTranslation();
        drawMap();
    }

    function clampTranslation() {
        // Prevent map from being dragged completely out of view
        const scaledWidth = mapImage.width * scale;
        const scaledHeight = mapImage.height * scale;

        // Allow some padding so user can always see the edge
        const paddingX = canvas.width * 0.5;
        const paddingY = canvas.height * 0.5;

        const minX = -scaledWidth + paddingX;
        const maxX = canvas.width - paddingX;
        const minY = -scaledHeight + paddingY;
        const maxY = canvas.height - paddingY;

        translateX = Math.min(Math.max(translateX, minX), maxX);
        translateY = Math.min(Math.max(translateY, minY), maxY);
    }

    // --- Data Loading ---
    async function loadI18n() {
        try {
            const response = await fetch('data/i18n.json');
            i18nData = await response.json();
        } catch (error) {
            console.error('Error loading i18n data:', error);
        }
    }

    async function loadMapData() {
        try {
            const response = await fetch('data/map_data.json');
            mapData = await response.json();
        } catch (error) {
            console.error('Error loading map data:', error);
        }
    }

    // --- UI Updating ---
    function updateUI() {
        if (!i18nData[currentLang]) return;

        const t = i18nData[currentLang];

        titleText.textContent = t.title;
        langToggle.textContent = t.lang_toggle;
        startLabel.textContent = t.start_label;
        destLabel.textContent = t.dest_label;
        navigateBtn.textContent = t.navigate_btn;

        startInput.placeholder = t.select_start;
        destInput.placeholder = t.select_dest;
    }

    function populateDropdowns() {
        if (!mapData || !mapData.nodes) return;

        // Sort nodes alphabetically for easier finding
        const nodes = mapData.nodes.slice().sort((a, b) => a.id.localeCompare(b.id));

        nodes.forEach(node => {
            const option = document.createElement('option');
            option.value = node.id;
            nodesList.appendChild(option);
        });
    }

    // Start App
    init();
});
