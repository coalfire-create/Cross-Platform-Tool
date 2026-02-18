import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import multer from "multer";
import { db } from "./db";
import { reservations, users } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.set("trust proxy", 1);

  const isProduction = process.env.NODE_ENV === "production" || !!process.env.REPL_ID;

  const allowedOrigins = [
    "https://owlq.co.kr",
    "https://www.owlq.co.kr",
  ];
  if (!isProduction) {
    allowedOrigins.push("http://localhost:5000");
  }

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    }
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  if (!process.env.SESSION_SECRET && isProduction) {
    console.warn("SESSION_SECRET이 설정되지 않았습니다. 운영 환경에서는 반드시 설정하세요.");
  }

  app.use(session({
    store: storage.sessionStore,
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
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
    } catch (err) { done(err); }
  });

  passport.use(new LocalStrategy(
    { usernameField: 'phoneNumber', passwordField: 'password' },
    async (phone, pw, done) => {
      try {
        const cleanPhone = phone.replace(/-/g, '');
        const user = await storage.getUserByPhone(cleanPhone);
        if (!user) return done(null, false, { message: '정보가 일치하지 않습니다.' });

        const isMatch = await bcrypt.compare(pw, user.password);
        if (!isMatch) {
          if (user.password === pw) {
            const hashed = await bcrypt.hash(pw, 10);
            await db.update(users).set({ password: hashed }).where(eq(users.id, user.id));
          } else {
            return done(null, false, { message: '정보가 일치하지 않습니다.' });
          }
        }
        return done(null, user);
      } catch (err) { return done(err); }
    }
  ));

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
        teacherFeedback: reservations.teacherFeedback,
        teacherPhotoUrl: reservations.teacherPhotoUrl,
        status: reservations.status,
        content: reservations.content,
        type: reservations.type
      })
      .from(reservations)
      .innerJoin(users, eq(reservations.userId, users.id))
      .orderBy(desc(reservations.createdAt));

      const formatted = data.map(r => ({
        ...r,
        seatNumber: r.seatNumber ? parseInt(r.seatNumber.toString()) : 0,
        day: r.type === 'onsite' ? "현장" : "온라인",
        period: 0
      }));
      res.json(formatted);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "데이터 로딩 실패" });
    }
  });

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
        teacherFeedback: reservations.teacherFeedback,
        teacherPhotoUrl: reservations.teacherPhotoUrl,
        status: reservations.status,
        content: reservations.content,
        type: reservations.type
      })
      .from(reservations)
      .innerJoin(users, eq(reservations.userId, users.id))
      .where(eq(reservations.userId, myId))
      .orderBy(desc(reservations.createdAt));

      const formatted = data.map(r => ({
        ...r,
        seatNumber: r.seatNumber ? parseInt(r.seatNumber.toString()) : 0,
        day: r.type === 'onsite' ? "현장" : "온라인",
        period: 0
      }));
      res.json(formatted);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "데이터 로딩 실패" });
    }
  });

  app.get("/api/reservations", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const myId = (req.user as any).id;
    try {
      const data = await db.select()
        .from(reservations)
        .where(eq(reservations.userId, myId))
        .orderBy(desc(reservations.createdAt));
      res.json(data);
    } catch (e) {
      res.status(500).json({ message: "데이터 로딩 실패" });
    }
  });

  app.post("/api/upload", upload.single("file"), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "파일이 없습니다." });
    try {
      const ext = req.file.originalname?.split(".").pop() || "jpg";
      const fileName = `${crypto.randomUUID()}.${ext}`;

      const { data, error } = await supabase.storage
        .from("uploads")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from("uploads")
        .getPublicUrl(data.path);

      res.json({ url: publicData.publicUrl });
    } catch (error: any) {
      console.error("파일 업로드 오류:", error);
      res.status(500).json({ message: error.message || "파일 업로드 실패" });
    }
  });

  app.post(api.reservations.create.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "로그인이 필요합니다." });
    try {
      const { type, photoUrls } = api.reservations.create.input.parse(req.body);
      const userId = (req.user as any).id;
      const content = req.body.content || null;

      if (type === 'onsite') {
        const dailyCount = await storage.getDailyOnsiteCount(userId, new Date());
        if (dailyCount >= 3) return res.status(403).json({ message: "현장 질문은 하루 3회까지만 가능합니다." });
      }

      const reservation = await storage.createReservation({
        userId,
        scheduleId: null,
        type,
        photoUrls: photoUrls || [],
        content,
        status: 'pending',
        teacherFeedback: null,
        teacherPhotoUrl: null,
      });
      res.status(201).json(reservation);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "입력값 오류" });
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/reservations/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const r = await storage.getReservation(id);
      if (!r) return res.status(404).json({ message: "예약을 찾을 수 없습니다." });

      if (user.role === 'teacher') {
        res.json(await storage.updateReservation(id, {
          status: req.body.status,
          teacherFeedback: req.body.teacherFeedback,
          teacherPhotoUrl: req.body.teacherPhotoUrl,
        }));
      } else if (r.userId === user.id) {
        res.json(await storage.updateReservation(id, {
          content: req.body.content,
          photoUrls: req.body.photoUrls,
        }));
      } else {
        res.status(403).json({ message: "권한이 없습니다." });
      }
    } catch (err) {
      console.error("수정 오류:", err);
      res.status(500).json({ message: "수정 실패" });
    }
  });

  app.delete("/api/reservations/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const r = await storage.getReservation(id);
      if (!r) return res.status(404).json({ message: "예약을 찾을 수 없습니다." });
      if (r.userId !== user.id && user.role !== 'teacher') return res.status(403).json({ message: "권한이 없습니다." });
      await storage.deleteReservation(id);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ message: "삭제 실패" }); }
  });

  app.post(api.auth.login.path, passport.authenticate('local'), (req, res) => {
    const user = req.user as any;
    const { password, ...safeUser } = user;
    res.json(safeUser);
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
      if (await storage.getUserByPhone(cleanPhone)) return res.status(409).json({ message: "이미 가입된 번호입니다." });
      const allowed = await storage.getAllowedStudent(cleanPhone);
      if (!allowed) return res.status(403).json({ message: "수강생 명단에 없는 번호입니다." });

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await storage.createUser({
        username: cleanPhone,
        phoneNumber: cleanPhone,
        password: hashedPassword,
        name: allowed.name,
        seatNumber: allowed.seatNumber ? allowed.seatNumber.toString() : "0",
        role: "student",
      });
      req.login(newUser, (err) => {
        if (err) return res.status(500).json({ message: "로그인 실패" });
        const { password: _, ...safeUser } = newUser;
        res.status(201).json(safeUser);
      });
    } catch (err) {
      console.error("회원가입 오류:", err);
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const { password, ...safeUser } = req.user as any;
    res.json(safeUser);
  });

  app.get(api.schedules.list.path, async (_req, res) => {
    res.json([]);
  });

  app.get("/api/stats/students", async (_req, res) => {
    try {
      const count = await storage.getAllowedStudentsCount();
      res.json({ count });
    } catch (err) {
      res.status(500).json({ message: "조회 실패" });
    }
  });

  return httpServer;
}
