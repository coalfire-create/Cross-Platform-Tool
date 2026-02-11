import dns from "dns";

// 🛑 [시스템 해킹] DNS 조회 함수 강제 교체 (IPv6 원천 봉쇄)
// Render 서버가 죽어도 IPv6로 못 가게 막는 코드입니다.
const originalLookup = dns.lookup;
// @ts-ignore
dns.lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  options.family = 4; // 🔥 무조건 IPv4만 찾아라! (강제 명령)
  return originalLookup(hostname, options, callback);
};

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { createClient } from "@supabase/supabase-js";

const { Pool } = pg;

// ✅ [설정] 환경변수 무시하고 "직통 연결" 정보 직접 입력
// 이유: aws-0/aws-1 혼란을 피하고, Tenant 에러를 방지하기 위함
const connectionConfig = {
  // ⭐ 직통 주소 사용 (aws-0, aws-1 신경 쓸 필요 없음)
  host: "db.zaojtbdaywtggzjpagrd.supabase.co", 
  port: 5432,
  user: "postgres", // 직통이라 아이디가 깔끔함
  password: "VstYBLTUxGOOI18u", // 비밀번호
  database: "postgres",
  ssl: { 
    rejectUnauthorized: false 
  },
  connectionTimeoutMillis: 10000,
};

console.log("---------------------------------------------");
console.log("🚀 [DB 연결] IPv4 강제 모드로 접속 시도");
console.log(`🎯 Host: ${connectionConfig.host}`);
console.log("---------------------------------------------");

export const pool = new Pool(connectionConfig);

pool.on('error', (err) => {
  console.error('❌ [DB 에러]:', err);
});

export const db = drizzle(pool, { schema });

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
export const supabase = createClient(supabaseUrl || "", supabaseKey || "");