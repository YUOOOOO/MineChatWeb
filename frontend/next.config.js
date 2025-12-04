/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 移除 appDir 配置，因为在 Next.js 13.4+ 中已经是默认的
  },

  // 修复workspace root警告
  outputFileTracingRoot: __dirname,

  // Environment variables configuration
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },

  // 不使用 rewrites，让 Nginx 直接处理 /api/* 的代理
  // 前端会调用相对路径如 /api/v1/chat/completion
  // Nginx 配置中需要有：location ^~ /api/ { proxy_pass http://127.0.0.1:8000; }

  // Headers for CORS and WebSocket upgrade
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, x-requested-with',
          },
          {
            key: 'Upgrade',
            value: 'websocket',
          },
          {
            key: 'Connection',
            value: 'Upgrade',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig