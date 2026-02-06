import dns from "dns";

// 1. [필수] DNS IPv4 우선 설정 (Render 연결 문제 방지용)
// 이 코드는 파일의 가장 윗부분에 유지해주세요.
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
    console.log("✅ [DB] DNS 설정 완료: IPv4 우선 사용");
  }
} catch (e) {
  console.error("❌ [DB] DNS 설정 실패:", e);
}

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { createClient } from "@supabase/supabase-js";

// 2. Postgres DB 연결 설정
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000, // 5초 동안 연결 안 되면 재시도
  // 💡 도메인(aws-0...) 사용 시에는 ssl 옵션을 기본값으로 두는 게 가장 좋습니다.
  // (만약 나중에 "self signed certificate" 에러가 뜨면, 그때만 아래 주석을 푸세요)
  // ssl: { rejectUnauthorized: false }, 
});

export const db = drizzle(pool, { schema });

// 3. Supabase Client 연결 (이미지 업로드 기능용)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase 키가 없어서 업로드 기능이 제한될 수 있습니다.");
}

// Supabase 관리자 권한으로 클라이언트 생성
export const supabase = createClient(supabaseUrl || "", supabaseKey || "");