import dns from "dns";
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

// DATABASE_URL 환경변수 사용하되, 호스트만 IPv4로 교체
const databaseUrl = process.env.DATABASE_URL || "";
const url = new URL(databaseUrl);

const connectionConfig = {
  host: "15.164.120.176", // ⭐ Pooler IPv4 (도메인 대신)
  port: parseInt(url.port) || 5432,
  user: url.username, // postgres.zaojtbdaywtggzjpagrd
  password: url.password, // VstYBLTUxGOOI18u
  database: url.pathname.slice(1) || "postgres",
  ssl: { 
    rejectUnauthorized: false 
  },
  connectionTimeoutMillis: 10000,
};

console.log("---------------------------------------------");
console.log("🚀 [DB Pooler 연결 (IPv4)]");
console.log(`🎯 Host: ${connectionConfig.host}`);
console.log(`📍 Port: ${connectionConfig.port}`);
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