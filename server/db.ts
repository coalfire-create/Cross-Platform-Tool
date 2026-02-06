import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { createClient } from "@supabase/supabase-js";

// 1. Postgres DB 연결 (IP 접속을 위한 보안 예외 처리 추가)
const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  // 🚨 [핵심] IP로 접속할 때 에러가 안 나도록 인증서 검사를 끕니다.
  ssl: { rejectUnauthorized: false } 
});

export const db = drizzle(pool, { schema });

// 2. Supabase 연결
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");