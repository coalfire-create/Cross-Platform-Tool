// =================================================================
// 🚨 [필수] DB 연결 전, IPv4 강제 설정 (가장 먼저 실행됨)
// =================================================================
import dns from "dns";
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
    console.log("✅ [DB] IPv4 우선 설정 적용 완료");
  }
} catch (e) {
  console.error("❌ [DB] DNS 설정 실패:", e);
}

// =================================================================
// 👇 여기서부터 기존 코드
// =================================================================
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { createClient } from "@supabase/supabase-js";

// 1. Postgres DB 연결
const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000, // 연결 타임아웃 5초
});

export const db = drizzle(pool, { schema });

// 2. Supabase 클라이언트 연결
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase 키가 없습니다.");
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");