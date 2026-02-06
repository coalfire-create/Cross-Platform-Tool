// =================================================================
// 🚨 [DNS 강제 설정] IPv4 우선 사용 (네트워크 연결 보장)
// =================================================================
import dns from "dns";
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch (e) {
  console.error(e);
}

// =================================================================
// 👇 여기서부터 DB 연결 설정
// =================================================================
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { createClient } from "@supabase/supabase-js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  // 🚨 [마누스 솔루션 적용] SSL 인증서 검증을 강제로 끕니다.
  // 이 설정이 있어야 Render에서 Supabase로 "아이디"가 정상 전달됩니다.
  ssl: {
    rejectUnauthorized: false 
  }
});

export const db = drizzle(pool, { schema });

// Supabase Client (이미지 업로드용)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
export const supabase = createClient(supabaseUrl || "", supabaseKey || "");