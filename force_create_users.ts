import { pool } from "./server/db";

async function main() {
  console.log("🚀 [수술 시작] 기존 데이터는 건드리지 않고 'users' 테이블만 생성합니다...");

  try {
    // users 테이블 강제 생성 SQL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ [성공] 'users' 테이블이 안전하게 생성되었습니다!");
  } catch (error) {
    console.error("❌ [실패] 에러 발생:", error);
  } finally {
    console.log("👋 작업을 종료합니다.");
    process.exit(0);
  }
}

main();