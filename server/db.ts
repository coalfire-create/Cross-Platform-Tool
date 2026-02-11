import dns from "dns";
// 1. [핵심] IPv6 문제 해결 (ENETUNREACH 방지)
// 이 설정 덕분에 이제 "직통 주소"를 써도 안전하게 연결됩니다.
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

// 2. [설정] Direct 연결 (환경변수 NODE_OPTIONS와 함께 IPv4 강제)
const connectionConfig = {
  host: "db.zaojtbdaywtggzjpagrd.supabase.co", // ⭐ Direct 주소
  port: 5432, // ⭐ Direct 포트
  user: "postgres", // ⭐ 프로젝트명 없이
  password: "VstYBLTUxGOOI18u",
  database: "postgres",
  ssl: { 
    rejectUnauthorized: false 
  },
  connectionTimeoutMillis: 10000,
};

console.log("---------------------------------------------");
console.log("🚀 [DB Direct 연결 시도]");
console.log(`🎯 Host: ${connectionConfig.host} (IPv4 강제)`);
console.log(`👤 User: ${connectionConfig.user}`);
console.log("---------------------------------------------");

export const pool = new Pool(connectionConfig);

pool.on('error', (err) => {
  console.error('❌ [DB 연결 에러]:', err);
});

export const db = drizzle(pool, { schema });

// Supabase Client (이미지 업로드용)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");