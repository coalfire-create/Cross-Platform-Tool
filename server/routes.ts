import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import multer from "multer";
import { supabase } from "./db"; // ✅ Supabase 연결 가져오기

// 1. 메모리에 임시 저장 (Supabase로 바로 쏘기 위해)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // 2. 파일 업로드 API (Supabase Storage 연동)
  app.post("/api/upload", upload.single("file"), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "파일이 없습니다." });

    try {
      // 파일 이름을 유니크하게 만듭니다 (한글 깨짐 방지 위해 영문/숫자 변환)
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;
      const filePath = `${fileName}`; // 폴더 없이 바로 저장

      // ✅ Supabase 'uploads' 버킷에 업로드
      const { data, error } = await supabase.storage
        .from('uploads') // 아까 만든 버킷 이름
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) {
        console.error("Supabase 업로드 에러:", error);
        throw error;
      }

      // ✅ 업로드된 파일의 인터넷 주소(Public URL) 가져오기
      const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData.publicUrl;
      console.log("업로드 성공:", fileUrl);

      res.json({ url: fileUrl });

    } catch (error) {
      console.error("Upload failed:", error);
      res.status(500).json({ message: "사진 업로드에 실패했습니다." });
    }
  });

  // ============================================================
  // 아래부터는 기존 코드와 동일합니다 (로그인, 예약 등)
  // ============================================================

  // Passport 설정
  passport.use(new LocalStrategy({
    usernameField: 'phoneNumber',
    passwordField: 'password'
  }, async (phoneNumber, password, done) => {
    try {
      const cleanPhone = phoneNumber.replace(/-/g, '');
      const user = await storage.getUserByPhone(cleanPhone);
      if (!user) return done(null, false, { message: '등록되지 않은 번호' });
      if (user.password !== password) return done(null, false, { message: '비번 불일치' });
      return done(null, user);
    } catch (err) { return done(err); }
  }));

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try { const user = await storage.getUser(id); done(null, user); } 
    catch (err) { done(err); }
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: true,
    saveUninitialized: true,
    store: storage.sessionStore,
    proxy: true,
    cookie: { secure: false, maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: "lax" },
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // CORS
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With");
    if (req.method === "OPTIONS") res.sendStatus(200); else next();
  });

  app.use("/api", (req, res, next) => {
    if (req.path !== "/login" && req.path !== "/register" && !req.isAuthenticated()) {
      // console.log(`Unauthorized: ${req.method} ${req.path}`);
    }
    next();
  });

  // 통계
  app.get("/api/stats/students", async (req, res) => {
    try { res.json({ count: await storage.getAllowedStudentsCount() }); } 
    catch (err) { res.status(500).json({ message: "Error" }); }
  });

  // Auth
  app.post(api.auth.login.path, passport.authenticate('local'), (req, res) => res.json(req.user));
  app.post(api.auth.logout.path, (req, res, next) => req.logout((err) => err ? next(err) : res.sendStatus(200)));

  // 회원가입 (Supabase 명단 확인)
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const { phoneNumber, password } = api.auth.register.input.parse(req.body);
      const cleanPhone = phoneNumber.replace(/-/g, '');

      if (await storage.getUserByPhone(cleanPhone)) return res.status(409).json({ message: "이미 가입됨" });

      const { data: allowed, error } = await supabase
        .from('students').select('*').eq('phone_number', cleanPhone).single();

      if (error || !allowed) return res.status(403).json({ message: "명단에 없는 번호" });

      const newUser = await storage.createUser({
        phoneNumber: cleanPhone, password, 
        name: allowed.name, seatNumber: parseInt(allowed.seat_number), role: "student"
      });
      req.login(newUser, (err) => err ? res.status(500).json({ message: "Login Fail" }) : res.status(201).json(newUser));
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Server Error" });
    }
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.user) return res.sendStatus(401);
    res.json(req.user);
  });

  // Schedules & Reservations
  app.get(api.schedules.list.path, async (req, res) => {
    const schedules = await storage.getSchedules();
    const result = await Promise.all(schedules.map(async (s) => {
      const count = await storage.getReservationCount(s.id);
      const isReserved = req.user ? await storage.checkUserReserved((req.user as any).id, s.id) : false;
      return { ...s, currentCount: count, isReservedByUser: isReserved };
    }));
    res.json(result);
  });

  app.post(api.reservations.create.path, async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const { scheduleId, type, photoUrls } = api.reservations.create.input.parse(req.body);
      const userId = (req.user as any).id;

      if (type === 'onsite') {
        if (!scheduleId) return res.status(400).json({ message: "교시 필수" });
        if (await storage.getDailyOnsiteCount(userId, new Date()) >= 3) return res.status(403).json({ message: "3회 초과" });

        const sch = await storage.getSchedule(scheduleId);
        const cnt = await storage.getReservationCount(scheduleId);
        if (!sch || cnt >= sch.capacity) return res.status(409).json({ message: "정원 초과" });
        if (await storage.checkUserReserved(userId, scheduleId)) return res.status(409).json({ message: "이미 예약됨" });
      }

      const r = await storage.createReservation({
        userId, scheduleId: (type === 'onsite' && scheduleId) ? scheduleId : null,
        type, photoUrls: photoUrls || [], content: req.body.content || null,
        status: 'pending', teacherFeedback: null,
      });
      res.status(201).json(r);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "예약 생성 실패" });
    }
  });

  app.get(api.reservations.myHistory.path, async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    res.json(await storage.getUserReservations((req.user as any).id));
  });

  app.get(api.reservations.list.path, async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    res.json(await storage.getReservationsForTeacher());
  });

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

  async function seed() {} seed();

  return httpServer;
}
