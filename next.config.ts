import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  outputFileTracingIncludes: {
    "/**": ["./prisma/**/*"],
  },
  async rewrites() {
    return [
      {
        source: "/:category(healthcare|salon-beauty|hotels-banquets|food-restaurants|schools-coaching|fitness-sports)",
        destination: "/categories/:category",
      },
    ];
  },
};

export default nextConfig;
