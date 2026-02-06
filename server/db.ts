import dns from "dns";

// [마누스 가이드 source: 29] Node.js pg 라이브러리 SSL 설정 강제
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch (e) {
  console.error(e);
}

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
  // 🚨 [핵심 수정] 마누스 가이드 source: 36, 37 적용
  // Render 환경에서 SSL 연결을 위해 이 옵션이 반드시 필요합니다.
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });

// Supabase 클라이언트 (이미지 업로드용)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
export const supabase = createClient(supabaseUrl || "", supabaseKey || "");