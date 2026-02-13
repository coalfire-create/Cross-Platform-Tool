import { pgTable, text, serial, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =================================================================
// 📊 [TABLE DEFINITIONS]
// =================================================================

// 1. 화이트리스트 테이블
export const allowedStudents = pgTable("allowed_students", {
  name: text("name").notNull(),
  // ✨ [수정] 여기 .unique()를 확실히 뺐습니다! 이제 충돌 안 납니다.
  phoneNumber: text("phone_number").notNull(), 
  seatNumber: integer("seat_number").notNull(),
});

// 2. 사용자 테이블 (회원가입된 학생/선생님)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // ✨ [수정] 여기도 .unique() 제거 및 점(.) 오류 수정 완료
  username: text("username").notNull(), 
  phoneNumber: text("phone_number").notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  seatNumber: integer("seat_number"),
  role: text("role").default("student").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 3. 시간표 테이블
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  dayOfWeek: text("day_of_week").notNull(),
  periodNumber: integer("period_number").notNull(),
  capacity: integer("capacity").default(4).notNull(),
});

// 4. 예약 테이블
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), 
  scheduleId: integer("schedule_id"),
  type: text("type").notNull(),
  content: text("content"),
  photoUrls: text("photo_urls").array().default([]).notNull(),
  teacherFeedback: text("teacher_feedback"),
  teacherPhotoUrl: text("teacher_photo_url"), // 선생님 사진 URL
  status: text("status").default("pending").notNull(),
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
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
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

export type LoginRequest = { phoneNumber: string; password: string };
export type SignupRequest = { phoneNumber: string; password: string };

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