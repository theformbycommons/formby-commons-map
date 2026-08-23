export const FORMBY_BOUNDS = {
  sw: { lat: 53.515, lng: -3.120 },
  ne: { lat: 53.600, lng: -3.010 },
  center: { lat: 53.5575, lng: -3.065 },
  defaultZoom: 13,
};

export const FORMBY_LEAFLET_BOUNDS: [[number, number], [number, number]] = [
  [FORMBY_BOUNDS.sw.lat, FORMBY_BOUNDS.sw.lng],
  [FORMBY_BOUNDS.ne.lat, FORMBY_BOUNDS.ne.lng],
];

export function isWithinFormby(lat: number, lng: number): boolean {
  return (
    lat >= FORMBY_BOUNDS.sw.lat &&
    lat <= FORMBY_BOUNDS.ne.lat &&
    lng >= FORMBY_BOUNDS.sw.lng &&
    lng <= FORMBY_BOUNDS.ne.lng
  );
}
