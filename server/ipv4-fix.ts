// server/ipv4-fix.ts
import dns from "dns";

try {
  // Node.js 17+ 버전부터 지원하는 기능입니다.
  // 서버가 도메인을 찾을 때 IPv4(옛날 주소)를 최우선으로 찾게 만듭니다.
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
    console.log("🚀 [System] DNS 설정 완료: IPv4를 무조건 우선 사용합니다.");
  }
} catch (e) {
  console.error("❌ [System] DNS 설정 실패:", e);
}
