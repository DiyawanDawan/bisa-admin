import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const tailwindCss = path.join(projectRoot, "node_modules/tailwindcss");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: projectRoot,

  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      tailwindcss: tailwindCss,
    };
    config.resolve.modules = [
      path.join(projectRoot, "node_modules"),
      ...(Array.isArray(config.resolve.modules)
        ? config.resolve.modules
        : ["node_modules"]),
    ];

    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  // Jangan set turbopack.root = projectRoot — bug Next.js #90307 resolve CSS dari folder parent (Apps).
  turbopack: {
    resolveAlias: {
      tailwindcss: tailwindCss,
    },
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
