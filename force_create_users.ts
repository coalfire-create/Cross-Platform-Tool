import { pool } from "./server/db";

async function main() {
  console.log("🚀 [종합 수술 시작] 'users' 테이블의 모든 필수 항목을 점검하고 추가합니다...");

  try {
    const client = await pool.connect();

    // 1. 전화번호 (phone_number) - 중복 방지(UNIQUE)는 상황 봐서 넣겠지만 일단 칸부터 생성
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS phone_number TEXT;
    `);
    console.log("✅ [확인] 전화번호(phone_number) 칸 준비 완료");

    // 2. 좌석번호 (seat_number) - 회원님이 말씀하신 핵심 항목
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS seat_number TEXT;
    `);
    console.log("✅ [확인] 좌석번호(seat_number) 칸 준비 완료");

    // 3. 이름 (name) - 보통 이게 빠지면 섭섭하죠
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS name TEXT;
    `);
    console.log("✅ [확인] 이름(name) 칸 준비 완료");

    // 4. 역할 (role) - 기본값 'student'
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
    `);
    console.log("✅ [확인] 역할(role) 칸 준비 완료");

    // 5. 생성일 (created_at) - 언제 가입했는지
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
    `);
    console.log("✅ [확인] 가입일(created_at) 칸 준비 완료");

    console.log("---------------------------------------------------");
    console.log("🎉 [수술 완료] 이제 전화번호, 좌석번호, 이름 모두 저장 가능합니다!");
    console.log("---------------------------------------------------");

    client.release();
  } catch (error) {
    console.error("❌ [실패] 에러 내용:", error);
  } finally {
    process.exit(0);
  }
}

main();