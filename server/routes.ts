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
import { db } from "./db"; 
import { reservations, users, schedules } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm"; // ✨ sql 추가됨!

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ✨✨ [핵심] 서버 시작 시 DB에 'teacher_photo_url' 칸 강제 생성 (에러 방지용) ✨✨
  try {
    await db.execute(sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS teacher_photo_url text;`);
    console.log("✅ [System] DB 사진 컬럼 자동 복구 완료");
  } catch (e) {
    console.log("ℹ️ [System] DB 점검 (이미 존재하거나 건너뜀)");
  }

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

  // =========================================================
  // 🚀 API Routes
  // =========================================================

  // 1. [선생님용] 모든 예약 조회 (사진 포함)
  app.get("/api/teacher/all", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const data = await db.select({
          id: reservations.id,
          userId: reservations.userId,
          scheduleId: reservations.scheduleId,
          photoUrls: reservations.photoUrls,
          createdAt: reservations.createdAt,
          studentName: users.name,
          seatNumber: users.seatNumber,
          day: schedules.dayOfWeek,
          period: schedules.periodNumber,
          teacherFeedback: reservations.teacherFeedback,
          teacherPhotoUrl: reservations.teacherPhotoUrl, // ✨ [추가] 선생님 사진 가져오기
          status: reservations.status,
          content: reservations.content,
          type: reservations.type
        })
        .from(reservations)
        .innerJoin(users, eq(reservations.userId, users.id))
        .leftJoin(schedules, eq(reservations.scheduleId, schedules.id))
        .orderBy(desc(reservations.createdAt));

      const formatted = data.map(r => ({ 
        ...r, 
        seatNumber: r.seatNumber ? parseInt(r.seatNumber.toString()) : 0,
        day: r.day || (r.type === 'onsite' ? "현장" : "온라인"),
        period: r.period || 0
      }));
      res.json(formatted);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "선생님 데이터 로딩 실패" });
    }
  });

  // 2. [학생용] 내 예약만 조회 (사진 포함)
  app.get("/api/student/my", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const myId = (req.user as any).id;

      const data = await db.select({
          id: reservations.id,
          userId: reservations.userId,
          scheduleId: reservations.scheduleId,
          photoUrls: reservations.photoUrls,
          createdAt: reservations.createdAt,
          studentName: users.name,
          seatNumber: users.seatNumber,
          day: schedules.dayOfWeek,
          period: schedules.periodNumber,
          teacherFeedback: reservations.teacherFeedback,
          teacherPhotoUrl: reservations.teacherPhotoUrl, // ✨ [추가] 선생님 사진 가져오기
          status: reservations.status,
          content: reservations.content,
          type: reservations.type
        })
        .from(reservations)
        .innerJoin(users, eq(reservations.userId, users.id))
        .leftJoin(schedules, eq(reservations.scheduleId, schedules.id))
        .where(eq(reservations.userId, myId))
        .orderBy(desc(reservations.createdAt));

      const formatted = data.map(r => ({ 
        ...r, 
        seatNumber: r.seatNumber ? parseInt(r.seatNumber.toString()) : 0,
        day: r.day || (r.type === 'onsite' ? "현장" : "온라인"),
        period: r.period || 0
      }));
      res.json(formatted);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "학생 데이터 로딩 실패" });
    }
  });

  app.get("/api/reservations", async (req, res) => {
     res.redirect("/api/student/my");
  });

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

  // ✨✨ [핵심 수정] 예약 수정 (PATCH) - 선생님 사진 저장 추가 ✨✨
  app.patch("/api/reservations/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const r = await storage.getReservation(id);
      if (!r) return res.status(404).json({ message: "예약 없음" });

      if (user.role === 'teacher') {
        // 🚀 선생님일 경우: 여기서 teacherPhotoUrl을 받아서 storage로 넘깁니다!
        res.json(await storage.updateReservation(id, { 
          status: req.body.status, 
          teacherFeedback: req.body.teacherFeedback,
          teacherPhotoUrl: req.body.teacherPhotoUrl // 👈 여기가 있어야 사진이 저장됩니다!!
        }));
      } else if (r.userId === user.id) {
        // 학생일 경우
        res.json(await storage.updateReservation(id, { 
          content: req.body.content, 
          photoUrls: req.body.photoUrls 
        }));
      } else {
        res.status(403).json({ message: "권한 없음" });
      }
    } catch (err) { 
        console.error("Update Error:", err);
        res.status(500).json({ message: "수정 실패" }); 
    }
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