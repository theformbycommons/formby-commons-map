// Helper for constructing URLs that respect a NEXT_PUBLIC_BASE_PATH (used for GitHub Pages)
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function bp(path: string) {
  if (!path) return BASE_PATH || '/';
  // Ensure single slash between base and path
  if (!BASE_PATH) return path;
  if (BASE_PATH.endsWith('/') && path.startsWith('/')) return `${BASE_PATH}${path.slice(1)}`;
  if (!BASE_PATH.endsWith('/') && !path.startsWith('/')) return `${BASE_PATH}/${path}`;
  return `${BASE_PATH}${path}`;
}
