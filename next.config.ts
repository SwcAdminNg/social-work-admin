import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imgs.search.brave.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname:
          "social-work.3e2d92fb6e61b82cdf636471ee41f62c.r2.cloudflarestorage.com",
        port: "",
        pathname: "/courses/**",
      },
      {
        protocol: "https",
        hostname: "pub-ba1e951cf7c545af846050a6519d5f4f.r2.dev",
        port: "",
        pathname: "/courses/**",
      },
    ],
  },
};

export default nextConfig;
