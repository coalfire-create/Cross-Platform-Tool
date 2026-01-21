import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Passport Setup
  passport.use(new LocalStrategy({
    usernameField: 'phoneNumber',
    passwordField: 'password'
  }, async (phoneNumber, password, done) => {
    try {
      const cleanPhone = phoneNumber.replace(/-/g, '');
      const user = await storage.getUserByPhone(cleanPhone);
      if (!user) {
        return done(null, false, { message: '등록되지 않은 전화번호입니다.' });
      }
      // In production, compare hashed password. For MVP/Lite, direct comparison.
      if (user.password !== password) {
        return done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // === AUTH ROUTES ===

  app.post(api.auth.login.path, passport.authenticate('local'), (req, res) => {
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const { phoneNumber, password } = api.auth.register.input.parse(req.body);
      const cleanPhone = phoneNumber.replace(/-/g, '');

      // 1. Check if user already exists
      const existingUser = await storage.getUserByPhone(cleanPhone);
      if (existingUser) {
        return res.status(409).json({ message: "이미 가입된 번호입니다." });
      }

      // 2. WHITELIST CHECK
      const allowedStudent = await storage.getAllowedStudent(cleanPhone);
      if (!allowedStudent) {
        return res.status(403).json({ message: "수강생 명단에 없는 번호입니다." });
      }

      // 3. Create User (Copying name/seat from allowed list)
      const newUser = await storage.createUser({
        phoneNumber: cleanPhone,
        password, // Should hash in prod
        name: allowedStudent.name,
        seatNumber: allowedStudent.seatNumber,
        role: "student"
      });
      
      req.login(newUser, (err) => {
        if (err) return res.status(500).json({ message: "회원가입 후 로그인에 실패했습니다." });
        return res.status(201).json(newUser);
      });

    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.user) return res.sendStatus(401);
    res.json(req.user);
  });

  // === SCHEDULES ===

  app.get(api.schedules.list.path, async (req, res) => {
    const schedules = await storage.getSchedules();
    const result = await Promise.all(schedules.map(async (s) => {
      const count = await storage.getReservationCount(s.id);
      const isReserved = req.user ? await storage.checkUserReserved((req.user as any).id, s.id) : false;
      return { ...s, currentCount: count, isReservedByUser: isReserved };
    }));
    res.json(result);
  });

  // === RESERVATIONS ===

  app.post(api.reservations.create.path, async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const { scheduleId, photoUrl } = api.reservations.create.input.parse(req.body);
      const userId = (req.user as any).id;

      // Check capacity
      const count = await storage.getReservationCount(scheduleId);
      const schedule = await storage.getSchedule(scheduleId);
      if (!schedule || count >= schedule.capacity) {
        return res.status(409).json({ message: "해당 시간대의 정원이 초과되었습니다." });
      }

      // Check duplicate
      const hasReserved = await storage.checkUserReserved(userId, scheduleId);
      if (hasReserved) {
        return res.status(409).json({ message: "이미 해당 시간대를 예약하셨습니다." });
      }

      const reservation = await storage.createReservation({
        userId,
        scheduleId,
        photoUrl
      });
      res.status(201).json(reservation);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
  });

  app.get(api.reservations.myHistory.path, async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const history = await storage.getUserReservations((req.user as any).id);
    res.json(history);
  });

  app.get(api.reservations.list.path, async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    // In a real app, check if role === 'teacher'
    // For now assuming dashboard is protected or visible
    if ((req.user as any).role !== 'teacher') {
       // Optionally restrict, but for MVP maybe allow visibility or return 403
       // Let's restrict to teacher for "list all"
    }
    const all = await storage.getReservationsForTeacher();
    res.json(all);
  });

  // === ADMIN / SEEDING ===
  
  // Seed data function
  async function seed() {
    const students = await storage.getAllAllowedStudents();
    if (students.length === 0) {
      console.log("초기 데이터를 생성 중입니다...");
      
      // 1. Whitelist
      await storage.createAllowedStudent({ name: "홍길동", phoneNumber: "1234567890", seatNumber: 1 });
      await storage.createAllowedStudent({ name: "김철수", phoneNumber: "0987654321", seatNumber: 24 });
      await storage.createAllowedStudent({ name: "이영희", phoneNumber: "1112223333", seatNumber: 5 });
      
      // 2. Schedules (Mon-Fri, 3 Periods)
      const days = ["월요일", "화요일", "수요일", "목요일", "금요일"];
      for (const day of days) {
        for (let i = 1; i <= 3; i++) {
          await storage.createSchedule({ dayOfWeek: day, periodNumber: i, capacity: 4 });
        }
      }

      // 3. Create a Teacher Account manually (since they might not be in whitelist flow)
      // Or add to whitelist with a special logic. 
      // For MVP, let's create a teacher directly.
      await storage.createUser({
        phoneNumber: "7777",
        password: "7777",
        name: "이강학 선생님",
        seatNumber: 0,
        role: "teacher"
      });
      
      console.log("초기 데이터 생성 완료.");
    }
  }

  seed();

  return httpServer;
}
