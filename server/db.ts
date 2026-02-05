// =================================================================
// 🚨 [핵심 수정] DB 연결 전에 IPv4 사용을 강제하는 코드 (pg 라이브러리용)
// =================================================================
import dns from "dns";
try {
  // Node.js가 도메인 주소를 찾을 때 IPv4를 무조건 먼저 찾도록 변경합니다.
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
    console.log("✅ [DB] IPv4 우선 설정 완료 (Render 연결 문제 해결용)");
  }
} catch (e) {
  console.error("❌ [DB] DNS 설정 실패:", e);
}

// =================================================================
// 👇 아래부터는 원래 코드입니다
// =================================================================
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { createClient } from "@supabase/supabase-js";

// 1. 기존 DB 연결 (IPv4 설정 적용됨)
const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // 💡 혹시 몰라 연결 타임아웃 설정을 넉넉하게 추가해둡니다.
  connectionTimeoutMillis: 5000, 
});

export const db = drizzle(pool, { schema });

// 2. Supabase 연결 (🔥 핵심: 관리자 키 우선 사용)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase 키가 없습니다. 업로드가 안 될 수 있습니다.");
}

// 이 객체를 통해 업로드합니다.
export const supabase = createClient(supabaseUrl || "", supabaseKey || "");