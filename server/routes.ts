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
  limits: { fileSize: 10 * 1024 * 1024 },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  const isReplit = !!process.env.REPL_ID;
  const isProduction = process.env.NODE_ENV === "production" || isReplit;

  app.use(session({
    secret: process.env.SESSION_SECRET || "super-secret-key",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || false);
    } catch (err) { console.error(err); done(err); }
  });

  passport.use(new LocalStrategy({ usernameField: 'phoneNumber', passwordField: 'password' }, async (phone, pw, done) => {
    try {
      const cleanPhone = phone.replace(/-/g, '');
      const user = await storage.getUserByPhone(cleanPhone);
      if (!user || user.password !== pw) return done(null, false, { message: '정보가 일치하지 않습니다.' });
      return done(null, user);
    } catch (err) { return done(err); }
  }));

  // API Routes

  // 1. 업로드
  app.post("/api/upload", upload.single("file"), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "파일 없음" });
    try {
      const fileExt = req.file.originalname.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const { error } = await supabase.storage.from('uploads').upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
      res.json({ url: data.publicUrl });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // 2. 예약 생성 (교시 체크 제거됨)
  app.post(api.reservations.create.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "로그인이 필요합니다." });
    try {
      const { scheduleId, type, photoUrls } = api.reservations.create.input.parse(req.body);
      const userId = (req.user as any).id;
      const content = req.body.content || null;

      if (type === 'onsite') {
        const dailyCount = await storage.getDailyOnsiteCount(userId, new Date());
        if (dailyCount >= 3) return res.status(403).json({ message: "현장 질문은 하루 3회까지만 가능합니다." });

        if (scheduleId) {
           const schedule = await storage.getSchedule(scheduleId);
           const count = await storage.getReservationCount(scheduleId);
           if (!schedule) return res.status(404).json({ message: "존재하지 않는 시간표" });
           if (count >= schedule.capacity) return res.status(409).json({ message: "마감됨" });
           if (await storage.checkUserReserved(userId, scheduleId)) return res.status(409).json({ message: "이미 예약함" });
        }
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
      res.status(201).json(reservation);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "입력값 오류" });
      res.status(500).json({ message: err.message });
    }
  });

  // 3. 학생용 조회 (storage 함수 사용 - 개인 정보 보호 적용됨)
  app.get(api.reservations.myHistory.path, async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    // storage.ts에서 이미 user_id 필터링을 하고 있으므로 안전합니다.
    res.json(await storage.getUserReservations((req.user as any).id));
  });

  // 4. 선생님용 조회 (storage 함수 사용 - LEFT JOIN 적용됨)
  app.get(api.reservations.list.path, async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    // storage.ts에서 LEFT JOIN으로 수정했으므로 모든 질문이 보입니다.
    res.json(await storage.getReservationsForTeacher());
  });

  // 5. 수정/삭제
  app.patch("/api/reservations/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const r = await storage.getReservation(id);
      if (!r) return res.status(404).json({ message: "예약 없음" });

      if (user.role === 'teacher') {
        res.json(await storage.updateReservation(id, { status: req.body.status, teacherFeedback: req.body.teacherFeedback }));
      } else if (r.userId === user.id) {
        res.json(await storage.updateReservation(id, { content: req.body.content, photoUrls: req.body.photoUrls }));
      } else {
        res.status(403).json({ message: "권한 없음" });
      }
    } catch (err) { res.status(500).json({ message: "수정 실패" }); }
  });

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

  // Auth
  app.post(api.auth.login.path, passport.authenticate('local'), (req, res) => res.json(req.user));
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
      const { data: allowed } = await supabase.from('allowed_students').select('*').eq('phone_number', cleanPhone).single();
      if (!allowed) return res.status(403).json({ message: "명단에 없는 번호" });
      const newUser = await storage.createUser({ 
        username: cleanPhone, phoneNumber: cleanPhone, password, 
        name: allowed.name, seatNumber: allowed.seat_number ? allowed.seat_number.toString() : "", role: "student" 
      });
      req.login(newUser, (err) => err ? res.status(500).json({ message: "Login Fail" }) : res.status(201).json(newUser));
    } catch (err) { console.error("Register Error:", err); res.status(500).json({ message: "Server Error" }); }
  });
  app.get(api.auth.me.path, (req, res) => { if (!req.user) return res.sendStatus(401); res.json(req.user); });

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
    try {
      const { count, error } = await supabase.from('allowed_students').select('*', { count: 'exact', head: true });
      if (error) throw error;
      res.json({ count: count || 0 });
    } catch (err) { res.status(500).json({ message: "Error" }); }
  });

  return httpServer;
}