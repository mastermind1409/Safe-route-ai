import L from 'leaflet';

/**
 * All map markers use L.divIcon with inline SVG to avoid Leaflet's
 * missing-PNG icon bug with Vite/bundlers.
 */

export function createHazardIcon(severity: 'low' | 'moderate' | 'high'): L.DivIcon {
    const colors = {
        low: '#B45309',
        moderate: '#DC2626',
        high: '#991B1B',
    };
    const color = colors[severity];
    return L.divIcon({
        className: '',
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36],
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" fill="none">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="13" r="6" fill="white"/>
      <text x="14" y="17" text-anchor="middle" font-size="12" font-weight="bold" fill="${color}">!</text>
    </svg>`,
    });
}

export function createSafeHubIcon(type: 'pharmacy' | 'police_booth' | 'commercial_hub'): L.DivIcon {
    const icons: Record<string, { color: string; symbol: string }> = {
        pharmacy: { color: '#059669', symbol: '+' },
        police_booth: { color: '#0F766E', symbol: '★' },
        commercial_hub: { color: '#047857', symbol: '●' },
    };
    const { color, symbol } = icons[type];
    return L.divIcon({
        className: '',
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -36],
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" fill="none">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="13" r="6" fill="white"/>
      <text x="14" y="17" text-anchor="middle" font-size="13" font-weight="bold" fill="${color}">${symbol}</text>
    </svg>`,
    });
}

export function createUserLocationIcon(): L.DivIcon {
    return L.divIcon({
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        html: `<div style="position:relative;width:32px;height:32px;">
      <div class="pulse-ring" style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.3);"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 0 6px rgba(59,130,246,0.5);"></div>
    </div>`,
    });
}

export function createSimWalkerIcon(): L.DivIcon {
    return L.divIcon({
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        html: `<div style="position:relative;width:30px;height:30px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(14,116,144,0.2);"></div>
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0E7490" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;top:4px;left:4px;">
        <circle cx="12" cy="5" r="2"/>
        <path d="m9 20 1.5-5H15l1 5"/>
        <path d="M6.5 12 9 8.5l3 1 2.5-2"/>
      </svg>
    </div>`,
    });
}

export function createDropPinIcon(): L.DivIcon {
    return L.divIcon({
        className: '',
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" fill="none">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="#6366F1" opacity="0.85"/>
      <circle cx="14" cy="13" r="5" fill="white"/>
    </svg>`,
    });
}
