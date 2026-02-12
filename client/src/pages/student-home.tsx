import { useQuery } from "@tanstack/react-query";
import { Reservation, Schedule } from "@shared/schema";
import { StudentLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock, Globe, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function StudentHome() {
  const { user } = useAuth();

  const { data: reservations } = useQuery<Reservation[]>({ 
    queryKey: ["/api/reservations"] 
  });

  const nextReservation = reservations?.find(r => r.status === 'pending' || r.status === 'confirmed');

  return (
    <StudentLayout>
      <div className="space-y-8">
        {/* 인사말 섹션 */}
        <section>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            안녕하세요, {user?.name}님! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            올빼미Q에 오신걸 환영합니다
          </p>
        </section>

        {/* 다음 질문 일정 (상세보기 버튼 삭제됨) */}
        <Card className="bg-primary text-primary-foreground overflow-hidden border-none shadow-xl relative">
          <CardContent className="p-8">
            <div className="relative z-10">
              <p className="text-primary-foreground/70 text-sm font-medium mb-1">다음 질문 일정</p>
              <h2 className="text-4xl font-bold mb-4">
                {nextReservation ? (nextReservation.type === 'online' ? '온라인' : '현장') : '예정된 질문 없음'}
              </h2>
              <div className="flex items-center gap-2 text-primary-foreground/80">
                <Clock className="w-4 h-4" />
                <span>{nextReservation ? (nextReservation.type === 'online' ? '온라인 질문' : '현장 질문') : '질문을 예약해보세요'}</span>
              </div>
            </div>
            <Clock className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-white/5 rotate-12" />
          </CardContent>
        </Card>

        {/* 대시보드 통계 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-2xl font-bold">{reservations?.length || 0}</span>
              <span className="text-xs text-muted-foreground mt-1">총 예약 횟수</span>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                <MapPin className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-2xl font-bold">{user?.seatNumber || '-'}</span>
              <span className="text-xs text-muted-foreground mt-1">내 좌석 번호</span>
            </CardContent>
          </Card>
        </div>

        {/* 최근 예약 내역 (아이콘 및 텍스트 수정) */}
        <section>
          <h3 className="font-bold text-lg mb-4">최근 예약 내역</h3>
          <div className="space-y-3">
            {reservations?.slice(0, 5).map((res) => (
              <Card key={res.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
                      {res.type === 'online' ? (
                        <Globe className="w-6 h-6 text-blue-500" /> // '온' 대신 지구본 아이콘
                      ) : (
                        <MapPin className="w-6 h-6 text-orange-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold">
                        {res.type === 'online' ? '온라인 질문' : '현장 질문'} {/* 0교시 대신 명칭 변경 */}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(res.createdAt || new Date()), "PPP", { locale: ko })}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    res.status === 'confirmed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {res.status === 'confirmed' ? '예약 확정' : '예약 완료'}
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!reservations || reservations.length === 0) && (
              <div className="text-center py-12 text-muted-foreground bg-gray-50/50 rounded-2xl border-2 border-dashed">
                최근 예약 내역이 없습니다
              </div>
            )}
          </div>
        </section>
      </div>
    </StudentLayout>
  );
}