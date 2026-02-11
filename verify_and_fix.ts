import pg from 'pg';
const { Pool } = pg;

// 서버가 사용하는 것과 동일한 접속 주소
const connectionString = "postgresql://postgres.zaojtbdaywtggzjpagrd:FlEBCClmWILabdJx@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function verifyAndFix() {
  console.log("🕵️ [진실 확인] DB 상태를 직접 조회합니다...");

  const client = await pool.connect();
  try {
    // 1. 현재 테이블 상태 확인
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);

    const existingColumns = res.rows.map(r => r.column_name);
    console.log("------------------------------------------------");
    console.log("📋 [현재 DB에 있는 칼럼 목록]:");
    console.log(existingColumns.length > 0 ? existingColumns.join(", ") : "(테이블이 비어있거나 없습니다)");
    console.log("------------------------------------------------");

    // 2. 필요한 칼럼 정의 (오타 수정됨)
    const columnsToCreate = [
      { name: 'phone_number', type: 'TEXT' },
      { name: 'seat_number', type: 'TEXT' },
      { name: 'name', type: 'TEXT' },
      { name: 'role', type: 'TEXT DEFAULT \'student\'' }
    ];

    // 3. 루프를 돌며 부족한 칼럼 추가
    for (const col of columnsToCreate) {
      if (!existingColumns.includes(col.name)) {
        console.log(`🚨 '${col.name}' 칼럼이 없습니다! 생성 중...`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`);
        console.log(`✅ '${col.name}' 생성 완료!`);
      } else {
        console.log(`👌 '${col.name}' 칼럼은 이미 존재합니다.`);
      }
    }

    console.log("\n🎉 [모든 작업 완료] 이제 DB 장부가 완벽해졌습니다.");

  } catch (err) {
    console.error("❌ [오류 발생]:", err);
  } finally {
    client.release();
    pool.end();
  }
}

verifyAndFix();