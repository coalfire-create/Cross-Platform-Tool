import { StudentLayout } from "@/components/layout";
import { useReservations } from "@/hooks/use-reservations";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function StudentHistory() {
  const { history } = useReservations();

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-primary">예약 내역</h1>
          <p className="text-muted-foreground text-sm">지난 예약 및 예정된 예약 내역입니다.</p>
        </div>

        <div className="space-y-4">
          {history.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
            ))
          ) : history.data && history.data.length > 0 ? (
            history.data.map((res: any, idx: number) => (
              <div 
                key={idx} 
                className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col gap-4 animate-slide-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-bold text-foreground">{res.day}</span>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">예약 확정</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
                      {res.period}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{res.period}교시</span>
                      <span className="text-xs text-muted-foreground">정규 세션</span>
                    </div>
                  </div>
                  {res.photoUrl && (
                     <div className="h-10 w-10 rounded-full overflow-hidden border border-border">
                       <img src={res.photoUrl} alt="Verified" className="h-full w-full object-cover" />
                     </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">기록이 없습니다</h3>
              <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
                아직 예약한 내역이 없습니다. 첫 예약을 시작해보세요!
              </p>
              <Link href="/reserve">
                <Button className="rounded-xl bg-primary text-primary-foreground">
                  예약하러 가기
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
