import L from 'leaflet';
import { getCategoryConfig } from './categories';

/**
 * Generates an L.divIcon with custom category styling, status indicator, and selection state.
 */
export function createCategoryMarkerIcon(
  categoryKey?: string,
  isResolved = false,
  isSelected = false
): L.DivIcon {
  const config = getCategoryConfig(categoryKey);
  const color = config.color;

  const opacity = isResolved ? '0.8' : '1';
  const scale = isSelected ? 'transform: scale(1.3); z-index: 1000;' : '';

  const svgHtml = `
    <div style="position: relative; width: 32px; height: 42px; ${scale} transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);" class="custom-map-pin">
      <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}; filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.35));">
        <path d="M16 0C7.163 0 0 7.163 0 16C0 27 16 42 16 42C16 42 32 27 32 16C32 7.163 24.837 0 16 0Z" fill="${color}"/>
        <path d="M16 2C8.268 2 2 8.268 2 16C2 25.5 16 39.5 16 39.5C16 39.5 30 25.5 30 16C30 8.268 23.732 2 16 2Z" fill="none" stroke="#ffffff" stroke-width="2"/>
        <circle cx="16" cy="16" r="8" fill="white" />
      </svg>
      ${
        isResolved
          ? `
        <div style="position: absolute; top: -2px; right: -2px; background: #22c55e; color: white; border-radius: 50%; width: 15px; height: 15px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 1.5px solid white;">
          ✓
        </div>
      `
          : ''
      }
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -40],
  });
}
