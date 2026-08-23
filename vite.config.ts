import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "fonts/PressStart2P-Regular.ttf"],
      manifest: {
        name: "FormulaPixel — F1 Live Timing",
        short_name: "FormulaPixel",
        description: "Pixel-art F1 live timing, standings, and schedule.",
        theme_color: "#0d0d0d",
        background_color: "#0d0d0d",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
      },
      workbox: {
        // Precache the app shell + fonts/icons. Track outlines & liveries are
        // cached on first use (they're large; no need to precache all of them).
        globPatterns: ["**/*.{js,css,html,ttf,ico}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            // Static PNG assets (liveries, logos, track outlines).
            urlPattern: ({ url }) => url.pathname.startsWith("/images/") || url.pathname.startsWith("/icons/"),
            handler: "CacheFirst",
            options: {
              cacheName: "f1-images",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // OpenF1 / Jolpica REST: fast, but fall back to cache when offline
            // or rate-limited. Never cache the SSE stream (it's not GET-cacheable).
            urlPattern: ({ url }) =>
              url.hostname === "api.openf1.org" || url.hostname === "api.jolpi.ca",
            handler: "NetworkFirst",
            options: {
              cacheName: "f1-api",
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
      devOptions: {
        // Let us verify install/SW behavior in `vite dev` too.
        enabled: true,
        type: "module",
      },
    }),
  ],
});
