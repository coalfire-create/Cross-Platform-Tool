import { db } from "./db";
import {
  users,
  allowedStudents,
  schedules,
  reservations,
  type User,
  type InsertUser,
  type AllowedStudent,
  type Schedule,
  type Reservation,
  type ScheduleWithCount,
  type ReservationWithDetails,
} from "@shared/schema";
import { eq, and, count, desc, sql, gte, lte } from "drizzle-orm"; // gte, lte 추가됨
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;

  // Whitelist
  getAllowedStudent(phoneNumber: string): Promise<AllowedStudent | undefined>;
  createAllowedStudent(student: Omit<AllowedStudent, "id">): Promise<AllowedStudent>;
  getAllAllowedStudents(): Promise<AllowedStudent[]>;
  getAllowedStudentsCount(): Promise<number>;

  // Schedules
  getSchedules(): Promise<Schedule[]>;
  getSchedule(id: number): Promise<Schedule | undefined>;
  createSchedule(schedule: Omit<Schedule, "id">): Promise<Schedule>;

  // Reservations
  getReservationsBySchedule(scheduleId: number): Promise<Reservation[]>;
  getReservationCount(scheduleId: number): Promise<number>;
  createReservation(reservation: Omit<Reservation, "id" | "createdAt">): Promise<Reservation>;
  getUserReservations(userId: number): Promise<ReservationWithDetails[]>;
  getReservationsForTeacher(day?: string, period?: number): Promise<ReservationWithDetails[]>;
  updateReservation(id: number, update: Partial<Reservation>): Promise<Reservation>;
  checkUserReserved(userId: number, scheduleId: number): Promise<boolean>;
  getReservation(id: number): Promise<Reservation | null>;
  deleteReservation(id: number): Promise<void>;
  getDailyOnsiteCount(userId: number, date: Date): Promise<number>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // =================================================================
  // 🔐 [인증 관련]
  // =================================================================

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user;
  }

  async createUser(user: any): Promise<User> {
    const [newUser] = await db.insert(users).values({
      username: user.username || user.phoneNumber, 
      password: user.password,
      phoneNumber: user.phoneNumber,
      name: user.name,
      seatNumber: user.seatNumber ? user.seatNumber.toString() : "0",
      role: user.role || "student",
    }).returning();
    return newUser;
  }

  // =================================================================
  // 📋 [명단 관리 (Whitelist)]
  // =================================================================

  async getAllowedStudent(phoneNumber: string): Promise<AllowedStudent | undefined> {
    const [student] = await db.select().from(allowedStudents).where(eq(allowedStudents.phoneNumber, phoneNumber));
    return student;
  }

  async createAllowedStudent(student: Omit<AllowedStudent, "id">): Promise<AllowedStudent> {
    const [newStudent] = await db.insert(allowedStudents).values(student).returning();
    return newStudent;
  }

  async getAllAllowedStudents(): Promise<AllowedStudent[]> {
    return await db.select().from(allowedStudents).orderBy(allowedStudents.seatNumber);
  }

  async getAllowedStudentsCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(allowedStudents);
    return result.count;
  }

  // =================================================================
  // ⏰ [스케줄 관리]
  // =================================================================

  async getSchedules(): Promise<Schedule[]> {
    return await db.select().from(schedules);
  }

  async getSchedule(id: number): Promise<Schedule | undefined> {
    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    return schedule;
  }

  async createSchedule(schedule: Omit<Schedule, "id">): Promise<Schedule> {
    const [newSchedule] = await db.insert(schedules).values(schedule).returning();
    return newSchedule;
  }

  // =================================================================
  // 📅 [예약 관련]
  // =================================================================

  async getReservationsBySchedule(scheduleId: number): Promise<Reservation[]> {
    return await db.select().from(reservations).where(eq(reservations.scheduleId, scheduleId));
  }

  async getReservationCount(scheduleId: number): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(reservations)
      .where(and(eq(reservations.scheduleId, scheduleId), eq(reservations.type, 'onsite')));
    return result.count;
  }

  async getDailyOnsiteCount(userId: number, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // 날짜 비교 로직 수정 (drizzle-orm 방식)
    const [result] = await db.select({ count: count() })
      .from(reservations)
      .where(and(
        eq(reservations.userId, userId),
        eq(reservations.type, 'onsite'),
        gte(reservations.createdAt, startOfDay), // >= startOfDay
        lte(reservations.createdAt, endOfDay)    // <= endOfDay
      ));
    return result.count;
  }

  async createReservation(reservation: Omit<Reservation, "id" | "createdAt">): Promise<Reservation> {
    const [newReservation] = await db.insert(reservations).values(reservation).returning();
    return newReservation;
  }

  async getUserReservations(userId: number): Promise<ReservationWithDetails[]> {
    const result = await db.select({
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
      status: reservations.status,
      content: reservations.content,
      type: reservations.type
    })
    .from(reservations)
    .innerJoin(users, eq(reservations.userId, users.id))
    .leftJoin(schedules, eq(reservations.scheduleId, schedules.id))
    .where(eq(reservations.userId, userId))
    .orderBy(desc(reservations.createdAt));

    return result.map(r => ({ 
      ...r, 
      seatNumber: r.seatNumber ? parseInt(r.seatNumber.toString()) : 0,
      day: r.day || "온라인",
      period: r.period || 0
    }));
  }

  // ✨✨ [핵심 수정] 교시 없는 질문도 가져오도록 leftJoin으로 변경 + 조건 완화 ✨✨
  async getReservationsForTeacher(day?: string, period?: number): Promise<ReservationWithDetails[]> {
    let query = db.select({
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
      status: reservations.status,
      content: reservations.content,
      type: reservations.type
    })
    .from(reservations)
    .innerJoin(users, eq(reservations.userId, users.id))
    .leftJoin(schedules, eq(reservations.scheduleId, schedules.id)) // 스케줄 없어도 가져오기 위해 leftJoin 유지
    .orderBy(desc(reservations.createdAt)); // 최신순 정렬

    // 만약 day나 period 필터가 있다면 (기존 로직 호환성)
    // 하지만 지금은 전체 조회를 원하므로 필터 로직은 선택 사항으로 둡니다.

    const result = await query;
    return result.map(r => ({ 
      ...r, 
      seatNumber: r.seatNumber ? parseInt(r.seatNumber.toString()) : 0,
      day: r.day || (r.type === 'onsite' ? "현장" : "온라인"), // 교시 없으면 '현장' 또는 '온라인' 표시
      period: r.period || 0
    }));
  }

  async updateReservation(id: number, update: Partial<Reservation>): Promise<Reservation> {
    const [updated] = await db.update(reservations)
      .set(update)
      .where(eq(reservations.id, id))
      .returning();
    if (!updated) throw new Error("Reservation not found");
    return updated;
  }

  async checkUserReserved(userId: number, scheduleId: number): Promise<boolean> {
    const [existing] = await db.select()
      .from(reservations)
      .where(and(
        eq(reservations.userId, userId), 
        eq(reservations.scheduleId, scheduleId),
        eq(reservations.type, 'onsite')
      ));
    return !!existing;
  }

  async getReservation(id: number): Promise<Reservation | null> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation || null;
  }

  async deleteReservation(id: number): Promise<void> {
    await db.delete(reservations).where(eq(reservations.id, id));
  }
}

export const storage = new DatabaseStorage();