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
import { eq, and, count, desc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser & { name: string; seatNumber: number; role: string }): Promise<User>;
  
  // Whitelist
  getAllowedStudent(phoneNumber: string): Promise<AllowedStudent | undefined>;
  createAllowedStudent(student: Omit<AllowedStudent, "id">): Promise<AllowedStudent>;
  getAllAllowedStudents(): Promise<AllowedStudent[]>;

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

  // Auth
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user;
  }

  async createUser(user: InsertUser & { name: string; seatNumber: number; role: string }): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Whitelist
  async getAllowedStudent(phoneNumber: string): Promise<AllowedStudent | undefined> {
    const [student] = await db.select().from(allowedStudents).where(eq(allowedStudents.phoneNumber, phoneNumber));
    return student;
  }

  async createAllowedStudent(student: Omit<AllowedStudent, "id">): Promise<AllowedStudent> {
    const [newStudent] = await db.insert(allowedStudents).values(student).returning();
    return newStudent;
  }

  async getAllAllowedStudents(): Promise<AllowedStudent[]> {
    return await db.select().from(allowedStudents);
  }

  // Schedules
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

  // Reservations
  async getReservationsBySchedule(scheduleId: number): Promise<Reservation[]> {
    return await db.select().from(reservations).where(eq(reservations.scheduleId, scheduleId));
  }

  async getReservationCount(scheduleId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(reservations).where(and(eq(reservations.scheduleId, scheduleId), eq(reservations.type, 'onsite')));
    return result.count;
  }

  async getDailyOnsiteCount(userId: number, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [result] = await db.select({ count: count() })
      .from(reservations)
      .where(and(
        eq(reservations.userId, userId),
        eq(reservations.type, 'onsite'),
        sql`${reservations.createdAt} >= ${startOfDay} AND ${reservations.createdAt} <= ${endOfDay}`
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
      photoUrl: reservations.photoUrl,
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

    // Cast seatNumber to number to match type (it might be null in DB but strictly typed in join)
    return result.map(r => ({ 
      ...r, 
      seatNumber: r.seatNumber || 0,
      day: r.day || "온라인",
      period: r.period || 0
    }));
  }

  async getReservationsForTeacher(day?: string, period?: number): Promise<ReservationWithDetails[]> {
    let query = db.select({
      id: reservations.id,
      userId: reservations.userId,
      scheduleId: reservations.scheduleId,
      photoUrl: reservations.photoUrl,
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
    .leftJoin(schedules, eq(reservations.scheduleId, schedules.id));

    const result = await query;
    const filtered = result.filter(r => {
      if (r.type === 'onsite') {
        if (day && r.day !== day) return false;
        if (period && r.period !== period) return false;
      } else if (day || period) {
        // Online questions only show up when no specific day/period filter is active
        // or we could decide to show them in a special "Online" view
        return false; 
      }
      return true;
    });

    return filtered.map(r => ({ 
      ...r, 
      seatNumber: r.seatNumber || 0,
      day: r.day || "온라인",
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
}

export const storage = new DatabaseStorage();
