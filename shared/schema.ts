import { pgTable, text, serial, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const allowedStudents = pgTable("allowed_students", {
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  seatNumber: integer("seat_number").notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  phoneNumber: text("phone_number").notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  seatNumber: integer("seat_number"),
  role: text("role").default("student").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  dayOfWeek: text("day_of_week").notNull(),
  periodNumber: integer("period_number").notNull(),
  capacity: integer("capacity").default(4).notNull(),
});

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  scheduleId: integer("schedule_id"),
  type: text("type").notNull(),
  content: text("content"),
  photoUrls: text("photo_urls").array().default([]).notNull(),
  teacherFeedback: text("teacher_feedback"),
  teacherPhotoUrl: text("teacher_photo_url"),
  answeredBy: integer("answered_by"),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const timetables = pgTable("timetables", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  photoUrl: text("photo_url").notNull(),
  uploadedBy: integer("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const session = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const insertAllowedStudentSchema = createInsertSchema(allowedStudents);
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertScheduleSchema = createInsertSchema(schedules).omit({ id: true });
export const insertReservationSchema = createInsertSchema(reservations).omit({ id: true, createdAt: true });
export const insertTimetableSchema = createInsertSchema(timetables).omit({ id: true, createdAt: true });

export type AllowedStudent = typeof allowedStudents.$inferSelect;
export type User = typeof users.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type Timetable = typeof timetables.$inferSelect;

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
