import { useQuery } from "@tanstack/react-query";
import { Reservation } from "@shared/schema";
import { StudentLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Clock, Globe, CalendarPlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function StudentHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

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

        {/* 메인 대시보드 카드 (문구 삭제 및 심플화) */}
        <Card className="bg-primary text-primary-foreground overflow-hidden border-none shadow-xl relative">
          <CardContent className="p-8">
            <div className="relative z-10 flex flex-col items-start gap-8">

              {/* 텍스트 정보 (불필요한 문구 삭제됨) */}
              <div>
                <h2 className="text-4xl font-bold">
                  {nextReservation ? (nextReservation.type === 'online' ? '온라인' : '현장') : '질문 예약'}
                </h2>
                {/* 여기에 있던 '다음 질문 일정', '온라인 질문' 문구 모두 삭제함 */}
              </div>

              {/* 하얀색 예약하기 버튼 */}
              <Button 
                onClick={() => setLocation("/reserve")}
                className="bg-white text-primary hover:bg-white/90 font-bold px-6 py-6 text-md shadow-lg transition-transform active:scale-95 w-full sm:w-auto justify-start"
              >
                <CalendarPlus className="w-5 h-5 mr-2" />
                예약하기
              </Button>
            </div>

            {/* 배경 장식 아이콘 */}
            <Clock className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-white/5 rotate-12" />
          </CardContent>
        </Card>

        {/* 통계 정보 */}
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

        {/* 최근 예약 내역 */}
        <section>
          <h3 className="font-bold text-lg mb-4">최근 예약 내역</h3>
          <div className="space-y-3">
            {reservations?.slice(0, 5).map((res) => (
              <Card key={res.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
                      {res.type === 'online' ? (
                        <Globe className="w-6 h-6 text-blue-500" />
                      ) : (
                        <MapPin className="w-6 h-6 text-orange-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold">
                        {res.type === 'online' ? '온라인 질문' : '현장 질문'}
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