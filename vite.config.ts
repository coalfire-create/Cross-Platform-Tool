import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      // 🚨 [수정 완료] import.meta.dirname -> __dirname 으로 변경
      // Node.js CJS 환경에서 경로를 올바르게 찾도록 수정했습니다.
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  // 🚨 [수정 완료] 여기도 __dirname 적용
  root: path.resolve(__dirname, "client"),
  build: {
    // 🚨 [수정 완료] 여기도 __dirname 적용
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0", // 외부 접속 허용
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    // 🔥 [핵심 설정 유지] 백엔드 연결 프록시 설정
    proxy: {
      "/api": {
        target: "http://0.0.0.0:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});