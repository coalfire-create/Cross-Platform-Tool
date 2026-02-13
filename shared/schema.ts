import { pgTable, text, serial, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =================================================================
// 📊 [TABLE DEFINITIONS]
// =================================================================

// 1. 화이트리스트 테이블 (허용된 학생 명단)
export const allowedStudents = pgTable("allowed_students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  seatNumber: integer("seat_number").notNull(),
});

// 2. 사용자 테이블 (회원가입된 학생/선생님)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // 🔥 [핵심] DB의 username 필수 제약조건과 일치시킵니다.
  username: text("username").notNull().unique(), 
  phoneNumber: text("phone_number").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  seatNumber: integer("seat_number"),
  role: text("role").default("student").notNull(), // 'student' or 'teacher'
  createdAt: timestamp("created_at").defaultNow(),
});

// 3. 시간표 테이블
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  dayOfWeek: text("day_of_week").notNull(), // 월요일, 화요일 등
  periodNumber: integer("period_number").notNull(),
  capacity: integer("capacity").default(4).notNull(),
});

// 4. 예약 테이블 (수정됨)
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), 
  scheduleId: integer("schedule_id"), // 현장 질문의 경우 필수
  type: text("type").notNull(), // 'onsite' or 'online'
  content: text("content"), // 질문 내용
  photoUrls: text("photo_urls").array().default([]).notNull(), // 학생이 올린 사진 URL 배열
  teacherFeedback: text("teacher_feedback"), // 선생님 답변 텍스트
  teacherPhotoUrl: text("teacher_photo_url"), // ✨ [추가됨] 선생님이 보낸 첨부 사진 URL
  status: text("status").default("pending").notNull(), // 'pending', 'confirmed', 'answered', 'cancelled'
  createdAt: timestamp("created_at").defaultNow(),
});

// 5. 로그인 세션 저장용 테이블
export const session = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// =================================================================
// ✨ [ZOD SCHEMAS]
// =================================================================

export const insertAllowedStudentSchema = createInsertSchema(allowedStudents).omit({ id: true });

// 회원가입 시 필요한 데이터 검증 스키마
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({ id: true });
export const insertReservationSchema = createInsertSchema(reservations).omit({ id: true, createdAt: true });

// =================================================================
// 🧬 [EXPLICIT TYPES]
// =================================================================

export type AllowedStudent = typeof allowedStudents.$inferSelect;
export type User = typeof users.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;

// Auth 관련 타입
export type LoginRequest = { phoneNumber: string; password: string };
export type SignupRequest = { phoneNumber: string; password: string };

// 프론트엔드 출력을 위한 확장 타입
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