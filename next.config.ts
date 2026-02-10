import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // pdfkit uses __dirname to load .afm font files, but Turbopack rewrites
      // __dirname to /ROOT/, breaking font resolution. The standalone build
      // embeds all font data inline, avoiding this issue.
      pdfkit: "pdfkit/js/pdfkit.standalone.js",
    },
  },
  reactCompiler: true,
  images: {
    formats: ["image/webp"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  async headers() {
    return [
      {
        source: "/(.*)\\.(ico|png|svg|jpg|jpeg|webp|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
