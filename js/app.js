document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let currentLang = 'en';
    let i18nData = {};
    let mapData = null;
    let pathEngine = null;
    let mapImage = new Image();
    let drawnPath = null;
    let scale = 1;

    // --- DOM Elements ---
    const titleText = document.getElementById('title-text');
    const mapContainer = document.querySelector('.map-container');
    const canvas = document.getElementById('map-canvas');
    const ctx = canvas.getContext('2d');
    const langToggle = document.getElementById('lang-toggle');
    const startLabel = document.getElementById('start-label');
    const startSelect = document.getElementById('start-select');
    const destLabel = document.getElementById('dest-label');
    const destSelect = document.getElementById('dest-select');
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

        navigateBtn.addEventListener('click', () => {
            const startId = startSelect.value;
            const destId = destSelect.value;

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

        // Determine scale to fit map horizontally
        const containerWidth = mapContainer.clientWidth;
        scale = containerWidth / mapImage.width;

        // You could also do a min/max scale here if needed
        // scale = Math.max(scale, 0.5);

        // Set canvas size to match the scaled image
        canvas.width = mapImage.width * scale;
        canvas.height = mapImage.height * scale;

        // Also apply the scale to the CSS using transform if you prefer,
        // but drawing with scaled dimensions directly on context is simpler for path drawing.

        drawMap();
    }

    function drawMap() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background map
        ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

        // Draw path if exists
        if (drawnPath && drawnPath.length > 0) {
            drawPath();
        }
    }

    function drawPath() {
        if (!drawnPath || drawnPath.length === 0) return;

        ctx.beginPath();

        // Scale coordinates
        const startX = drawnPath[0].x * scale;
        const startY = drawnPath[0].y * scale;

        ctx.moveTo(startX, startY);

        for (let i = 1; i < drawnPath.length; i++) {
            const x = drawnPath[i].x * scale;
            const y = drawnPath[i].y * scale;
            ctx.lineTo(x, y);
        }

        // Thick, highly visible neon blue line
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Add a glow effect
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;

        ctx.stroke();

        // Draw start point
        ctx.beginPath();
        ctx.arc(startX, startY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#00ff00'; // Green for start
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow
        ctx.stroke();

        // Draw end point
        const endX = drawnPath[drawnPath.length - 1].x * scale;
        const endY = drawnPath[drawnPath.length - 1].y * scale;

        ctx.beginPath();
        ctx.arc(endX, endY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff0000'; // Red for end
        ctx.fill();
        ctx.stroke();
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

        // Update default options
        if (startSelect.options.length > 0) {
            startSelect.options[0].textContent = t.select_start;
        }
        if (destSelect.options.length > 0) {
            destSelect.options[0].textContent = t.select_dest;
        }
    }

    function populateDropdowns() {
        if (!mapData || !mapData.nodes) return;

        // Sort nodes alphabetically for easier finding
        const nodes = mapData.nodes.slice().sort((a, b) => a.id.localeCompare(b.id));

        nodes.forEach(node => {
            const optionStart = document.createElement('option');
            optionStart.value = node.id;
            optionStart.textContent = node.id;
            startSelect.appendChild(optionStart);

            const optionDest = document.createElement('option');
            optionDest.value = node.id;
            optionDest.textContent = node.id;
            destSelect.appendChild(optionDest);
        });
    }

    // Start App
    init();
});
