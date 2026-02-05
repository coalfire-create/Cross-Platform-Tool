import { pgTable, text, serial, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Whitelist table - pre-filled data
export const allowedStudents = pgTable("allowed_students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  seatNumber: integer("seat_number").notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  seatNumber: integer("seat_number"),
  role: text("role").default("student").notNull(), // 'student' or 'teacher'
  createdAt: timestamp("created_at").defaultNow(),
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  dayOfWeek: text("day_of_week").notNull(), // 월요일, 화요일, 등
  periodNumber: integer("period_number").notNull(),
  capacity: integer("capacity").default(4).notNull(),
});

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), 
  scheduleId: integer("schedule_id"), // 현장 질문의 경우 필수
  type: text("type").notNull(), // 'onsite' or 'online'
  content: text("content"), // 질문 내용 필드 추가
  photoUrls: text("photo_urls").array().default([]).notNull(), // 여러 사진 URL 배열
  teacherFeedback: text("teacher_feedback"), // 선생님 답변 추가
  status: text("status").default("pending").notNull(), // 'pending', 'confirmed', 'answered'
  createdAt: timestamp("created_at").defaultNow(),
});

// 🔥 [추가된 부분] 로그인 세션을 저장할 테이블 정의
export const session = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// === SCHEMAS ===

export const insertAllowedStudentSchema = createInsertSchema(allowedStudents).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, role: true, name: true, seatNumber: true }); // Signup only takes phone/password
export const insertScheduleSchema = createInsertSchema(schedules).omit({ id: true });
export const insertReservationSchema = createInsertSchema(reservations).omit({ id: true, createdAt: true });

// === EXPLICIT TYPES ===

export type AllowedStudent = typeof allowedStudents.$inferSelect;
export type User = typeof users.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;

// Auth-specific types
export type LoginRequest = { phoneNumber: string; password: string };
export type SignupRequest = { phoneNumber: string; password: string };

// Extended types for frontend display
export type ReservationWithDetails = Reservation & {
  studentName: string;
  seatNumber: number;
  day: string;
  period: number;
};

export type ScheduleWithCount = Schedule & {
  currentCount: number;
  isReservedByUser: boolean;
};