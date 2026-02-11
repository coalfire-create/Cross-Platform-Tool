import dns from "dns";

// 🛑 [네트워크] IPv4 강제 설정 (Render 접속 오류 방지)
const originalLookup = dns.lookup;
// @ts-ignore
dns.lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  options.family = 4; // 무조건 IPv4만 사용
  return originalLookup(hostname, options, callback);
};

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { createClient } from "@supabase/supabase-js";

const { Pool } = pg;

// ✅ [수정 완료] db... (X) -> aws-1... (O)
// 회원님이 찾으신 "정답 주소"를 여기에 넣었습니다.
const connectionConfig = {
  host: "aws-1-ap-northeast-2.pooler.supabase.com", // ⭐ 여기가 aws-1 입니다
  port: 5432, 
  user: "postgres.zaojtbdaywtggzjpagrd", // 프로젝트 ID가 포함된 유저명
  password: "VstYBLTUxGOOI18u", // 비밀번호
  database: "postgres",
  ssl: { 
    rejectUnauthorized: false 
  },
  connectionTimeoutMillis: 10000,
};

console.log("---------------------------------------------");
console.log("🚀 [DB 연결 시작] 정답 주소(aws-1)로 접속합니다.");
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