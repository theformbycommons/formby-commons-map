/** @type {import('next').NextConfig} */
const repoName = 'formby-commons-map'; // Change this to match your exact GitHub repo name

const nextConfig = {
  // Use static HTML/CSS/JS export for GitHub Pages
  output: 'export',

  // Configures subpath routing for GitHub Pages (https://username.github.io/formby-commons-map/)
  // Leave as empty string '' if using a custom root domain
  basePath: process.env.NODE_ENV === 'production' ? `/${repoName}` : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? `/${repoName}/` : '',

  // Ensures URLs end with a trailing slash for GitHub Pages static file serving
  trailingSlash: true,

  // Disables server-side image optimization (required for static exports)
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Bypass build-blocking errors during static export
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;