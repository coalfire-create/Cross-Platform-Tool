import { useAuth } from "@/hooks/use-auth";
import { StudentLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Bell, Calendar, Clock, MapPin } from "lucide-react";
import { useReservations } from "@/hooks/use-reservations";
import { format } from "date-fns";

export default function StudentHome() {
  const { user } = useAuth();
  const { history } = useReservations();

  // Find next upcoming reservation (mock logic for demo, as API returns history)
  const nextReservation = history.data?.[0]; 

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold font-display text-primary">
              안녕하세요, {user?.name.split(" ")[0]}님! 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              오늘도 성장을 위해 달려볼까요?
            </p>
          </div>
          <div className="p-2 bg-white rounded-full shadow-sm border border-border">
            <Bell className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Hero Card - Next Class or Call to Action */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl shadow-primary/20 p-6">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Clock className="w-32 h-32 transform rotate-12" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-lg font-medium opacity-90 mb-1">다음 질문 일정</h2>
            {nextReservation ? (
              <div className="mt-4">
                <div className="text-3xl font-bold font-display mb-2">{nextReservation.day}</div>
                <div className="flex items-center gap-2 text-primary-foreground/80 mb-6">
                  <Clock className="w-4 h-4" />
                  <span>{nextReservation.type === 'onsite' ? `${nextReservation.period}교시 (현장)` : '온라인 질문'}</span>
                </div>
                <Button variant="secondary" className="w-full sm:w-auto rounded-xl font-semibold text-primary">
                  상세 보기
                </Button>
              </div>
            ) : (
              <div className="mt-4">
                <div className="text-2xl font-bold font-display mb-4">예정된 질문이 없습니다</div>
                <Link href="/reserve">
                  <Button variant="secondary" className="w-full sm:w-auto rounded-xl font-semibold text-primary group">
                    질문하기
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats or Info */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-2xl border-none shadow-sm bg-white">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-foreground">{history.data?.length || 0}</span>
              <span className="text-xs text-muted-foreground">총 예약 횟수</span>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none shadow-sm bg-white">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-foreground">{user?.seatNumber || "-"}</span>
              <span className="text-xs text-muted-foreground">내 좌석 번호</span>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-lg font-bold font-display text-primary mb-4">최근 예약 내역</h3>
          <div className="space-y-3">
            {history.isLoading ? (
               [1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)
            ) : history.data?.slice(0, 3).map((res: any, idx: number) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                    {res.day.substring(0,1)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{res.period}교시</p>
                    <p className="text-xs text-muted-foreground">성공적으로 예약됨</p>
                  </div>
                </div>
                <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                  예약 확정
                </div>
              </div>
            ))}
            {!history.isLoading && history.data?.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">기록이 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
