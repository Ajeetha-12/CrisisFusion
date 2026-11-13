/**
 * CrisisFusion — Emergencies Management View Scripts
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    initModal();
    initDetailMap();
});

let modalFocusTrapCleanup = null;

function initModal() {
    const modalBackdrop = document.getElementById('modalBackdrop');
    const openBtn = document.getElementById('openModalBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelModalBtn');
    const autoTrigger = document.getElementById('autoOpenTrigger');

    if (!modalBackdrop) return;

    const open = () => {
        modalBackdrop.classList.add('open');
        modalBackdrop.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        // Apply focus trap
        if (typeof trapFocus === 'function') {
            modalFocusTrapCleanup = trapFocus(modalBackdrop.querySelector('.modal'));
        } else {
            const firstInput = modalBackdrop.querySelector('input, select');
            if (firstInput) firstInput.focus();
        }
    };

    const close = () => {
        modalBackdrop.classList.remove('open');
        modalBackdrop.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (modalFocusTrapCleanup) {
            modalFocusTrapCleanup();
            modalFocusTrapCleanup = null;
        }
    };

    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);

    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) close();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalBackdrop.classList.contains('open')) {
            close();
        }
    });

    // Auto-open if form had validation errors
    if (autoTrigger && autoTrigger.dataset.open === 'true') {
        open();
    }
}

function initDetailMap() {
    const mapEl = document.getElementById('detailMap');
    if (!mapEl || typeof L === 'undefined') return;

    const lat = parseFloat(mapEl.dataset.lat);
    const lng = parseFloat(mapEl.dataset.lng);
    const title = mapEl.dataset.title || 'Incident';
    const severity = mapEl.dataset.severity || 'critical';

    if (isNaN(lat) || isNaN(lng)) return;

    const detailMap = L.map('detailMap', {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
        dragging: true,
        doubleClickZoom: true,
        worldCopyJump: true
    });

    // Realistic satellite imagery (ESRI World Imagery, no API key required)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Imagery &copy; Esri, Maxar',
        maxZoom: 19
    }).addTo(detailMap);

    // Street labels overlay for legibility
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        opacity: 0.9
    }).addTo(detailMap);

    const severityColours = {
        critical: '#ef4444',
        high:     '#fb923c',
        medium:   '#fbbf24',
        low:      '#4ade80'
    };

    const color = severityColours[severity] || '#ef4444';
    const html = `
        <div class="map-pin ${severity === 'critical' ? 'map-pin-pulse' : ''}" style="--pin:${color};width:38px;height:51px;">
            <div class="map-pin-head">
                <span class="map-pin-glyph">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2 2 20h20L12 2z"/><path d="M12 9v5M12 17h.01"/>
                    </svg>
                </span>
            </div>
            <div class="map-pin-tip"></div>
        </div>`;

    const icon = L.divIcon({
        html,
        className: 'map-pin-wrap',
        iconSize: [38, 51],
        iconAnchor: [19, 51],
        popupAnchor: [0, -47]
    });
    L.marker([lat, lng], { icon }).addTo(detailMap).bindPopup(`<b>${title}</b>`).openPopup();

    setTimeout(() => {
        detailMap.invalidateSize();
    }, 200);
    setTimeout(() => {
        detailMap.invalidateSize();
    }, 500);
}

