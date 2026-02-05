import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import multer from "multer";
import { supabase } from "./db";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // =================================================================
  // 🚨 [배포 환경 필수 설정] 프록시 및 보안 쿠키 설정
  // =================================================================

  // 1. 프록시 신뢰 설정 (매우 중요)
  // Replit, Vercel 등은 로드밸런서(Proxy) 뒤에서 돌아갑니다.
  // 이 설정이 'true'여야 서버가 HTTPS 연결임을 인식하고 보안 쿠키를 허용합니다.
  app.set("trust proxy", true);

  // 2. CORS 수동 설정 (인증 쿠키 허용)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    // 모든 Origin 허용 (보안보다 기능 우선 시)
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

    // Preflight 요청 바로 통과
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  // 3. 환경 감지 (Replit 또는 Production 환경인지 확인)
  // REPL_ID가 있으면 Replit 배포 환경으로 간주합니다.
  const isReplit = !!process.env.REPL_ID;
  const isProduction = process.env.NODE_ENV === "production" || isReplit;

  console.log(`🌍 [Server] 현재 모드: ${isProduction ? "Production/Replit (HTTPS)" : "Development (HTTP)"}`);

  // 4. 세션 설정
  app.use(session({
    secret: process.env.SESSION_SECRET || "super-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    proxy: true, // 🔥 중요: 프록시 뒤에서 쿠키 동작 허용
    cookie: {
      // 배포 환경이면 무조건 Secure: true (HTTPS 필요)
      secure: isProduction,
      // 배포 환경이면 SameSite: none (크로스 사이트 허용), 로컬이면 lax
      sameSite: isProduction ? 'none' : 'lax',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1일
    },
  }));

  // 5. Passport 초기화
  app.use(passport.initialize());
  app.use(passport.session());

  // =================================================================
  // 🔐 [인증 로직] Passport 설정
  // =================================================================

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        // DB에 유저가 없으면 로그아웃 처리
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      console.error("🔥 [Auth] Deserialize Error:", err);
      done(err);
    }
  });

  passport.use(new LocalStrategy({ usernameField: 'phoneNumber', passwordField: 'password' }, async (phone, pw, done) => {
    try {
      const cleanPhone = phone.replace(/-/g, '');
      const user = await storage.getUserByPhone(cleanPhone);

      if (!user || user.password !== pw) {
        return done(null, false, { message: '정보가 일치하지 않습니다.' });
      }
      return done(null, user);
    } catch (err) { return done(err); }
  }));


  // =================================================================
  // 📡 [API 라우트]
  // =================================================================

  // 1. 파일 업로드
  app.post("/api/upload", upload.single("file"), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "파일 없음" });
    try {
      const fileExt = req.file.originalname.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('uploads')
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });

      if (error) throw error;

      const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
      res.json({ url: data.publicUrl });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // 2. 예약 생성 (핵심 기능)
  app.post(api.reservations.create.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "로그인이 필요합니다." });

    try {
      const { scheduleId, type, photoUrls } = api.reservations.create.input.parse(req.body);
      const userId = (req.user as any).id;
      const content = req.body.content || null;

      // 현장 질문 유효성 검사
      if (type === 'onsite') {
        if (!scheduleId) return res.status(400).json({ message: "교시 정보가 없습니다." });

        const dailyCount = await storage.getDailyOnsiteCount(userId, new Date());
        if (dailyCount >= 3) return res.status(403).json({ message: "현장 질문은 하루 3회까지만 가능합니다." });

        const schedule = await storage.getSchedule(scheduleId);
        const count = await storage.getReservationCount(scheduleId);

        if (!schedule) return res.status(404).json({ message: "존재하지 않는 시간표입니다." });
        if (count >= schedule.capacity) return res.status(409).json({ message: "마감된 시간입니다." });

        const hasReserved = await storage.checkUserReserved(userId, scheduleId);
        if (hasReserved) return res.status(409).json({ message: "이미 예약한 시간입니다." });
      }

      const reservation = await storage.createReservation({
        userId,
        scheduleId: (type === 'onsite' && scheduleId) ? scheduleId : null,
        type,
        photoUrls: photoUrls || [],
        content,
        status: 'pending',
        teacherFeedback: null,
      });

      console.log(`✅ [Reservation] Created ID: ${reservation.id}`);
      res.status(201).json(reservation);

    } catch (err: any) {
      console.error("❌ [Reservation] Failed:", err);
      if (err instanceof z.ZodError) return res.status(400).json({ message: "입력값 오류" });
      res.status(500).json({ message: err.message || "서버 오류" });
    }
  });

  // 3. 예약 조회 (내 예약)
  app.get(api.reservations.myHistory.path, async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    res.json(await storage.getUserReservations((req.user as any).id));
  });

  // 4. 예약 조회 (선생님용 전체)
  app.get(api.reservations.list.path, async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    res.json(await storage.getReservationsForTeacher());
  });

  // 5. 예약 수정
  app.patch("/api/reservations/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const r = await storage.getReservation(id);

      if (!r) return res.status(404).json({ message: "예약 없음" });

      if (user.role === 'teacher') {
        res.json(await storage.updateReservation(id, { 
          status: req.body.status, 
          teacherFeedback: req.body.teacherFeedback 
        }));
      } else if (r.userId === user.id) {
        res.json(await storage.updateReservation(id, { 
          content: req.body.content, 
          photoUrls: req.body.photoUrls 
        }));
      } else {
        res.status(403).json({ message: "권한 없음" });
      }
    } catch (err) { res.status(500).json({ message: "수정 실패" }); }
  });

  // 6. 예약 삭제
  app.delete("/api/reservations/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const r = await storage.getReservation(id);
      if (!r) return res.status(404).json({ message: "예약 없음" });
      if (r.userId !== user.id && user.role !== 'teacher') return res.status(403).json({ message: "권한 없음" });
      await storage.deleteReservation(id);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ message: "삭제 실패" }); }
  });

  // =================================================================
  // 🔑 [Auth 라우트]
  // =================================================================

  app.post(api.auth.login.path, passport.authenticate('local'), (req, res) => {
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => res.sendStatus(200));
    });
  });

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const { phoneNumber, password } = api.auth.register.input.parse(req.body);
      const cleanPhone = phoneNumber.replace(/-/g, '');

      if (await storage.getUserByPhone(cleanPhone)) return res.status(409).json({ message: "이미 가입됨" });

      const { data: allowed } = await supabase.from('students').select('*').eq('phone_number', cleanPhone).single();
      if (!allowed) return res.status(403).json({ message: "명단에 없는 번호" });

      const newUser = await storage.createUser({ 
        phoneNumber: cleanPhone, 
        password, 
        name: allowed.name, 
        seatNumber: parseInt(allowed.seat_number), 
        role: "student" 
      });

      req.login(newUser, (err) => err ? res.status(500).json({ message: "Login Fail" }) : res.status(201).json(newUser));
    } catch (err) { res.status(500).json({ message: "Server Error" }); }
  });

  app.get(api.auth.me.path, (req, res) => { 
    if (!req.user) return res.sendStatus(401); 
    res.json(req.user); 
  });

  app.get(api.schedules.list.path, async (req, res) => {
    const schedules = await storage.getSchedules();
    const result = await Promise.all(schedules.map(async (s) => {
      const count = await storage.getReservationCount(s.id);
      const isReserved = req.user ? await storage.checkUserReserved((req.user as any).id, s.id) : false;
      return { ...s, currentCount: count, isReservedByUser: isReserved };
    }));
    res.json(result);
  });

  app.get("/api/stats/students", async (req, res) => {
    try { res.json({ count: await storage.getAllowedStudentsCount() }); } catch (err) { res.status(500).json({ message: "Error" }); }
  });

  async function seed() {} seed();
  return httpServer;
}