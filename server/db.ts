import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { createClient } from "@supabase/supabase-js";

// 1. 기존 DB 연결 (건드리지 않음)
const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// 2. Supabase 연결 (🔥 핵심: 관리자 키 우선 사용)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase 키가 없습니다. 업로드가 안 될 수 있습니다.");
}

// 이 객체를 통해 업로드합니다.
export const supabase = createClient(supabaseUrl || "", supabaseKey || "");