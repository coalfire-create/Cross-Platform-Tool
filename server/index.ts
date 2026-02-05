import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

// Express 설정
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 1. 로그 함수 정의
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// 2. 요청/응답 로깅 미들웨어
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    log(`➡️ [요청 수신] ${req.method} ${req.path}`);
  }

  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `⬅️ [응답 완료] ${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  // 3. 라우트 및 기능 등록
  await registerRoutes(httpServer, app);

  // 4. 에러 핸들링
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("🔥 Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  // 5. 프론트엔드 연결 (개발환경 vs 배포환경)
  if (app.get("env") === "development") {
    // 개발 환경: Vite 설정 사용
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  } else {
    // 배포 환경: 빌드된 정적 파일 제공
    serveStatic(app);
  }

  // =================================================================
  // 🚨 [필수 수정] Render 배포를 위해 포트 설정을 변경했습니다.
  // process.env.PORT가 있으면 그걸 쓰고(Render), 없으면 5000번(로컬)을 씁니다.
  // =================================================================
  const port = Number(process.env.PORT) || 5000;

  httpServer.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`-------------------------------------------`);
    log(`✅ 서버가 정상적으로 켜졌습니다 (Port ${port})`);
    log(`-------------------------------------------`);
  });
})();