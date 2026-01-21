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
  type ReservationWithDetails
} from "@shared/schema";
import { eq, and, count, desc } from "drizzle-orm";
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
    const [result] = await db.select({ count: count() }).from(reservations).where(eq(reservations.scheduleId, scheduleId));
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
      period: schedules.periodNumber
    })
    .from(reservations)
    .innerJoin(users, eq(reservations.userId, users.id))
    .innerJoin(schedules, eq(reservations.scheduleId, schedules.id))
    .where(eq(reservations.userId, userId))
    .orderBy(desc(reservations.createdAt));

    // Cast seatNumber to number to match type (it might be null in DB but strictly typed in join)
    return result.map(r => ({ ...r, seatNumber: r.seatNumber || 0 }));
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
      period: schedules.periodNumber
    })
    .from(reservations)
    .innerJoin(users, eq(reservations.userId, users.id))
    .innerJoin(schedules, eq(reservations.scheduleId, schedules.id));

    if (day && period) {
      // Filter by day/period logic would go here if we were filtering inside the query builder
      // But for simplicity/time we can fetch and filter or build dynamic query
      // Let's rely on frontend filtering or precise query if needed.
      // For now returning all for dashboard to filter, or simple filtering:
    }
    
    const result = await query;
    const filtered = result.filter(r => {
      if (day && r.day !== day) return false;
      if (period && r.period !== period) return false;
      return true;
    });

    return filtered.map(r => ({ ...r, seatNumber: r.seatNumber || 0 }));
  }

  async checkUserReserved(userId: number, scheduleId: number): Promise<boolean> {
    const [existing] = await db.select()
      .from(reservations)
      .where(and(eq(reservations.userId, userId), eq(reservations.scheduleId, scheduleId)));
    return !!existing;
  }
}

export const storage = new DatabaseStorage();
