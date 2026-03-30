// ========== BINARY RAIN BACKGROUND (original speed) ==========
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

// ========== PLACE FILTER & CLICK LOGIC ==========
document.addEventListener("DOMContentLoaded", () => {
    initBinaryRain();

    const searchInput = document.getElementById("searchInput");
    const placesList = document.getElementById("placesList");
    const locationInfo = document.getElementById("locationInfo");

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
            <div class="place-item" 
                 data-index="${placesData.indexOf(place)}">
                🔍 ${place.displayName}
            </div>
        `).join("");

        document.querySelectorAll(".place-item").forEach(item => {
            item.addEventListener("click", () => {
                const index = parseInt(item.dataset.index);
                const place = placesData[index];

                let entriesHtml = "";
                place.entries.forEach((entry, i) => {
                    let coordsString = entry.coords;
                    if (!coordsString || coordsString.trim() === "") {
                        coordsString = null;
                    }

                    let mapLinkHtml = "";
                    if (coordsString) {
                        const [lat, lon] = coordsString.split(',').map(coord => parseFloat(coord.trim()));
                        if (!isNaN(lat) && !isNaN(lon)) {
                            mapLinkHtml = `🗺️ <a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank" style="color:#0f0;">OPEN MAP</a><br>`;
                        } else {
                            mapLinkHtml = `🗺️ <span style="color:#f00;">INVALID COORDINATES</span><br>`;
                        }
                    } else {
                        mapLinkHtml = `🗺️ <span style="color:#ff0;">NO COORDINATES SET</span><br>`;
                    }

                    entriesHtml += `
                        <strong>NAME :</strong> ${entry.name}<br>
                        <strong>PASS :</strong> ${entry.pass}<br>
                        <strong>LOCATION :</strong> ${entry.info}<br>
                        ${mapLinkHtml}
                    `;
                    if (i < place.entries.length - 1) {
                        entriesHtml += `-------------------------------<br>`;
                    }
                });

                locationInfo.innerHTML = entriesHtml;
            });
        });
    }

    renderList("");
    searchInput.addEventListener("input", (e) => renderList(e.target.value));
});

// ========== SCREENSHOT / KEYBOARD BLOCKING ==========
document.addEventListener('keydown', (e) => {
    // Block Print Screen, Ctrl+S, Ctrl+P, Ctrl+Shift+I/J/C
    if (e.key === 'PrintScreen' ||
        (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
        e.preventDefault();
        alert('📸 Screenshots / saving are disabled on this site.');
        return false;
    }
});

// Basic dev tools detection (optional)
setInterval(() => {
    const start = Date.now();
    debugger;
    const end = Date.now();
    if (end - start > 100) {
        alert('🔧 Developer tools detected! Please close them.');
    }
}, 5000);

// ========== DEVELOPER FEEDBACK ==========
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

            // Get stored username (if logged in)
            const username = sessionStorage.getItem('wifiiiss_username') || 'Anonymous';

            // Get device info (same as login)
            const userAgent = navigator.userAgent;
            let deviceInfo = 'Unknown';
            if (userAgent) {
                const androidMatch = userAgent.match(/Android\s([\d.]+)/);
                const modelMatch = userAgent.match(/;\s([^;]+?)\s+Build/);
                if (androidMatch && modelMatch) {
                    deviceInfo = `Android ${androidMatch[1]}, ${modelMatch[1]}`;
                } else if (androidMatch) {
                    deviceInfo = `Android ${androidMatch[1]}`;
                } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
                    deviceInfo = 'iOS Device';
                } else if (userAgent.includes('Windows')) {
                    deviceInfo = 'Windows PC';
                } else if (userAgent.includes('Macintosh')) {
                    deviceInfo = 'Mac';
                } else {
                    deviceInfo = userAgent.substring(0, 50);
                }
            }

            // Try to get location (optional)
            let location = null;
            if ("geolocation" in navigator) {
                try {
                    const pos = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    location = {
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude
                    };
                } catch (err) {
                    console.warn('Location not shared:', err);
                }
            }

            try {
                const response = await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message,
                        username,
                        deviceInfo,
                        location
                    })
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