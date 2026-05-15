/** @type {import('next').NextConfig} */
const stripTrailingSlash = (s) => s.replace(/\/$/, '')

// URL complète du backend côté serveur Next (jamais exposée au navigateur).
// Utilisée pour les rewrites : le front appelle /api/v1/... en même origine (évite HTTPS→HTTP bloqué).
const apiRewriteTarget =
  process.env.API_REWRITE_TARGET ||
  process.env.BACKEND_API_URL ||
  'http://127.0.0.1:8080/api/v1'

const nextConfig = {
  reactStrictMode: true,
  // Le proxy /api/v1 est gere par app/api/v1/[...path]/route.ts (injection JWT httpOnly).
}

module.exports = nextConfig
