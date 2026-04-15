import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    // ✅ FIXED & WORKING PWA SETUP
    VitePWA({
      registerType: "autoUpdate",

      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "favicon-96x96.png",
        "favicon.svg",
        "web-app-manifest-192x192.png",
        "web-app-manifest-512x512.png",
        "screenshots/desktop.png",
        "screenshots/mobile.png",
      ],

      devOptions: {
        enabled: true,
      },

      workbox: {
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
      },

      manifest: {
        id: "/",
        name: "Huntsworld",
        short_name: "Huntsworld",
        description: "HuntsWorld MERN B2B Application",

        start_url: "/",
        scope: "/",
        display: "standalone",

        theme_color: "#ffffff",
        background_color: "#ffffff",

        icons: [
          {
            src: "/web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],

        screenshots: [
          {
            src: "/screenshots/desktop.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "/screenshots/mobile.png",
            sizes: "375x812",
            type: "image/png",
          },
        ],
      },
    })

  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // 🔥 FIX FOR "URI MALFORMED"
  server: {
    fs: {
      strict: false,
      allow: ["."],
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },

  // ✅ PERFORMANCE OPTIMIZATION
  build: {
    chunkSizeWarningLimit: Infinity,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "vendor-react";
            }

            if (
              id.includes("@radix-ui") ||
              id.includes("class-variance-authority") ||
              id.includes("clsx") ||
              id.includes("tailwind-merge") ||
              id.includes("lucide-react")
            ) {
              return "vendor-ui";
            }

            if (id.includes("framer-motion")) {
              return "vendor-framer";
            }
          }
        },
      },
    },
  },
});
