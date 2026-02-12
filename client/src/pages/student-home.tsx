import { useQuery } from "@tanstack/react-query";
import { Reservation } from "@shared/schema";
import { StudentLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Globe, CalendarPlus, Sparkles } from "lucide-react";
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

        {/* ✨ 메인 대시보드 카드 (디자인 업그레이드) ✨ */}
        <Card className="border-none shadow-xl overflow-hidden relative bg-gradient-to-br from-slate-800 to-slate-900">
          <CardContent className="p-0 min-h-[220px] flex flex-col items-center justify-center relative">

            {/* 배경 장식 (은은한 빛) */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

            {/* 내용 영역 */}
            <div className="relative z-10 flex flex-col items-center gap-6 text-center p-8 w-full">

              {nextReservation ? (
                // 1. 예약이 있을 때: 상태를 크고 예쁘게 보여줌
                <div className="animate-in fade-in zoom-in duration-500">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-md mb-4 shadow-inner ring-1 ring-white/20">
                    {nextReservation.type === 'online' ? (
                      <Globe className="w-10 h-10 text-blue-300" />
                    ) : (
                      <MapPin className="w-10 h-10 text-orange-300" />
                    )}
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {nextReservation.type === 'online' ? '온라인 질문 예약됨' : '현장 질문 예약됨'}
                  </h2>
                  <p className="text-slate-300 text-sm bg-black/20 px-4 py-1 rounded-full">
                    곧 선생님이 답변을 드릴 예정입니다
                  </p>
                </div>
              ) : (
                // 2. 예약이 없을 때: 버튼을 중앙에 강조
                <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-2">
                    <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    궁금한 문제가 있나요?
                  </h2>
                  <Button 
                    onClick={() => setLocation("/reserve")}
                    className="mt-2 bg-white text-slate-900 hover:bg-blue-50 hover:text-blue-600 font-bold px-8 py-7 text-lg rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all transform hover:-translate-y-1 active:scale-95 border border-white/50"
                  >
                    <CalendarPlus className="w-6 h-6 mr-2" />
                    질문 예약하기
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 통계 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-none shadow-md bg-white hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3 text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-slate-800">{reservations?.length || 0}</span>
              <span className="text-xs text-muted-foreground mt-1 font-medium">총 예약 횟수</span>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white hover:bg-gray-50 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-3 text-orange-600">
                <MapPin className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-slate-800">{user?.seatNumber || '-'}</span>
              <span className="text-xs text-muted-foreground mt-1 font-medium">내 좌석 번호</span>
            </CardContent>
          </Card>
        </div>

        {/* 최근 예약 내역 */}
        <section>
          <h3 className="font-bold text-lg mb-4 text-slate-800">최근 예약 내역</h3>
          <div className="space-y-3">
            {reservations?.slice(0, 5).map((res) => (
              <Card key={res.id} className="border-none shadow-sm hover:shadow-md transition-all duration-200 group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                      {res.type === 'online' ? (
                        <Globe className="w-6 h-6 text-blue-500" />
                      ) : (
                        <MapPin className="w-6 h-6 text-orange-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        {res.type === 'online' ? '온라인 질문' : '현장 질문'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(res.createdAt || new Date()), "PPP", { locale: ko })}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${
                    res.status === 'confirmed' 
                      ? 'bg-green-50 text-green-600 border-green-100' 
                      : 'bg-blue-50 text-blue-600 border-blue-100'
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