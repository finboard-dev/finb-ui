import type { NextConfig } from "next";

const nextConfig = {
    reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src https://docs.google.com/;"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
