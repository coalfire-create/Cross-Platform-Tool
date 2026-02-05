import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

// 🚨 [수정됨] Supabase 코드는 여기서 다 뺐습니다! (db.ts에서 관리)
// 순환 참조 에러를 막기 위해서입니다.

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 로그 함수
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// 🔥 [로그 강화] 요청이 들어오자마자 즉시 로그를 찍습니다.
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
  // 라우트 등록
  await registerRoutes(httpServer, app);

  // 에러 핸들링
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("🔥 Server Error:", err); // 에러 발생 시 빨간 로그 출력
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // 포트 5000번 고정
  const port = 5000;
  httpServer.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`-------------------------------------------`);
    log(`✅ 서버가 정상적으로 켜졌습니다 (Port ${port})`);
    log(`-------------------------------------------`);
  });
})();