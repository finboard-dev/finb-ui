import type { NextConfig } from "next";

const nextConfig = {
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
