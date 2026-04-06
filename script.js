// ========== BINARY RAIN BACKGROUND ==========
function initBinaryRain() {
    const canvas = document.createElement('canvas');
    canvas.id = 'binaryCanvas';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');

    let width, height;
    let columns;
    let drops = [];
    const binaryChars = ['0', '1'];

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        columns = Math.floor(width / 20);
        drops = Array(columns).fill(1);
    }

    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#0f0';
        ctx.font = '18px monospace';

        for (let i = 0; i < columns; i++) {
            const text = binaryChars[Math.floor(Math.random() * binaryChars.length)];
            const x = i * 20;
            const y = drops[i] * 20;
            ctx.fillText(text, x, y);
            if (y > height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
    });
    resizeCanvas();
    draw();
}

// ========== MAP GLOBALS ==========
let globalMap = null;
let allMarkers = [];

// Helper: parse coordinate string "lat, lng"
function parseCoords(coordStr) {
    if (!coordStr || typeof coordStr !== 'string') return null;
    const parts = coordStr.split(',').map(part => parseFloat(part.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { lat: parts[0], lng: parts[1] };
    }
    return null;
}

// Initialize terrain map (OpenTopoMap = Eliff style)
function initTerrainMap() {
    if (globalMap) return;
    const mapContainer = document.getElementById('wifiTerrainMap');
    if (!mapContainer) return;

    // Center on Cebu (average of coordinates)
    globalMap = L.map('wifiTerrainMap').setView([10.305, 123.885], 14);

    L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors, <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 18,
        minZoom: 12
    }).addTo(globalMap);

    loadAllWifiMarkers();
}

// Load all WiFi points from placesData into map markers
function loadAllWifiMarkers() {
    if (!globalMap) return;

    // remove old markers if any
    allMarkers.forEach(marker => {
        if (globalMap.hasLayer(marker)) globalMap.removeLayer(marker);
    });
    allMarkers = [];

    for (let place of placesData) {
        if (!place.entries) continue;
        for (let entry of place.entries) {
            const coords = parseCoords(entry.coords);
            if (!coords) continue;

            const popupContent = `
                <div style="min-width: 160px;">
                    <strong>📡 NAME :</strong> ${escapeHtml(entry.name)}<br>
                    <strong>🔑 PASS :</strong> <span style="background:#000; padding:2px 4px; border-radius:6px;">${escapeHtml(entry.pass)}</span><br>
                    <strong>📍 INFO :</strong> ${escapeHtml(entry.info)}<br>
                    <strong>🗺️</strong> <a href="https://www.google.com/maps?q=${coords.lat},${coords.lng}" target="_blank" style="color:#0f0;">Open in Google Maps</a>
                </div>
            `;

            const marker = L.marker([coords.lat, coords.lng], {
                title: entry.name,
                riseOnHover: true
            }).bindPopup(popupContent, {
                maxWidth: 260,
                className: 'neon-wifi-popup'
            });

            marker.entryData = { entry, placeName: place.displayName };
            marker.addTo(globalMap);
            allMarkers.push(marker);
        }
    }

    if (allMarkers.length > 0) {
        const group = L.featureGroup(allMarkers);
        const bounds = group.getBounds();
        if (bounds.isValid()) {
            globalMap.fitBounds(bounds, { padding: [35, 35] });
        }
    }
}

// Helper: escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Focus map on a specific entry and open its popup
function focusOnWifiEntry(entry) {
    const marker = allMarkers.find(m => m.entryData.entry === entry);
    if (marker && globalMap) {
        globalMap.setView(marker.getLatLng(), 17);
        marker.openPopup();
    } else {
        const coords = parseCoords(entry.coords);
        if (coords && globalMap) {
            globalMap.setView([coords.lat, coords.lng], 17);
            L.popup()
                .setLatLng([coords.lat, coords.lng])
                .setContent(`📍 ${entry.name}<br>🔓 ${entry.pass}<br>📌 ${entry.info}`)
                .openOn(globalMap);
        }
    }
}

// ========== PLACE LIST & SEARCH ==========
document.addEventListener("DOMContentLoaded", () => {
    initBinaryRain();
    initTerrainMap();

    const searchInput = document.getElementById("searchInput");
    const placesList = document.getElementById("placesList");

    function renderList(filterText = "") {
        const lowerFilter = filterText.toLowerCase().trim();

        if (lowerFilter === "") {
            placesList.innerHTML = "";
            return;
        }

        const filtered = placesData.filter(place =>
            place.displayName.toLowerCase().includes(lowerFilter) ||
            (place.actualName && place.actualName.toLowerCase().includes(lowerFilter))
        );

        if (filtered.length === 0) {
            placesList.innerHTML = `<div class="place-item" style="opacity:0.7; cursor:default;">💀 NO MATCHING LOCATIONS 💀</div>`;
            return;
        }

        placesList.innerHTML = filtered.map(place => `
            <div class="place-item" data-place-idx="${placesData.indexOf(place)}">
                🔍 ${place.displayName}
            </div>
        `).join("");

        document.querySelectorAll(".place-item[data-place-idx]").forEach(item => {
            item.addEventListener("click", () => {
                const idx = parseInt(item.dataset.placeIdx);
                const place = placesData[idx];
                if (place && place.entries && place.entries.length) {
                    const validEntry = place.entries.find(e => parseCoords(e.coords) !== null);
                    if (validEntry) {
                        focusOnWifiEntry(validEntry);
                    } else if (globalMap) {
                        L.popup()
                            .setLatLng(globalMap.getCenter())
                            .setContent(`⚠️ ${place.displayName} has no valid coordinates.`)
                            .openOn(globalMap);
                    }
                }
            });
        });
    }

    renderList("");
    searchInput.addEventListener("input", (e) => renderList(e.target.value));
});

// ========== SCREENSHOT / KEYBOARD BLOCKING ==========
document.addEventListener('keydown', (e) => {
    if (e.key === 'PrintScreen' ||
        (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
        e.preventDefault();
        alert('📸 Screenshots / saving are disabled on this site.');
        return false;
    }
});

setInterval(() => {
    const start = Date.now();
    debugger;
    const end = Date.now();
    if (end - start > 100) {
        alert('🔧 Developer tools detected! Please close them.');
    }
}, 5000);

// ========== FEEDBACK (unchanged logic) ==========
document.addEventListener("DOMContentLoaded", () => {
    const feedbackBtn = document.getElementById('sendFeedbackBtn');
    const feedbackMsg = document.getElementById('feedbackMsg');
    const feedbackStatus = document.getElementById('feedbackStatus');

    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', async () => {
            const message = feedbackMsg.value.trim();
            if (!message) {
                feedbackStatus.textContent = '✏️ Please enter a message.';
                feedbackStatus.style.color = '#f90';
                return;
            }

            feedbackStatus.textContent = '📤 Sending...';
            feedbackStatus.style.color = '#0f0';

            const username = sessionStorage.getItem('wifiiiss_username') || 'Anonymous';
            let deviceInfo = 'Unknown';
            const ua = navigator.userAgent;
            if (ua) {
                const androidMatch = ua.match(/Android\s([\d.]+)/);
                const modelMatch = ua.match(/;\s([^;]+?)\s+Build/);
                if (androidMatch && modelMatch) deviceInfo = `Android ${androidMatch[1]}, ${modelMatch[1]}`;
                else if (androidMatch) deviceInfo = `Android ${androidMatch[1]}`;
                else if (ua.includes('iPhone') || ua.includes('iPad')) deviceInfo = 'iOS Device';
                else if (ua.includes('Windows')) deviceInfo = 'Windows PC';
                else if (ua.includes('Macintosh')) deviceInfo = 'Mac';
                else deviceInfo = ua.substring(0, 50);
            }

            let location = null;
            if ("geolocation" in navigator) {
                try {
                    const pos = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    location = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                } catch (err) {
                    console.warn('Location not shared:', err);
                }
            }

            try {
                const response = await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message, username, deviceInfo, location })
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    feedbackStatus.textContent = '✅ Message sent!';
                    feedbackStatus.style.color = '#0f0';
                    feedbackMsg.value = '';
                    setTimeout(() => {
                        feedbackStatus.textContent = '';
                    }, 3000);
                } else {
                    throw new Error(data.error || 'Failed to send');
                }
            } catch (err) {
                console.error(err);
                feedbackStatus.textContent = '❌ Failed to send. Try again.';
                feedbackStatus.style.color = '#f66';
            }
        });
    }
});