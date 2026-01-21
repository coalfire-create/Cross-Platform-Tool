import { StudentLayout } from "@/components/layout";
import { useSchedules } from "@/hooks/use-schedules";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Lock, Check, Globe, MapPin } from "lucide-react";
import { useState } from "react";
import { ReservationModal } from "@/components/ui/reservation-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DAYS = ["월요일", "화요일", "수요일", "목요일", "금요일"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export default function StudentReserve() {
  const { data: schedules, isLoading } = useSchedules();
  const [selectedSlot, setSelectedSlot] = useState<{ id: number | null; day: string; period: number | null; type: 'onsite' | 'online' } | null>(null);
  const [filterDay, setFilterDay] = useState<string>("월요일");

  // Helper to find schedule for a specific slot
  const getSchedule = (day: string, period: number) => {
    return schedules?.find(s => s.dayOfWeek === day && s.periodNumber === period);
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-primary">질문하기</h1>
          <p className="text-muted-foreground text-sm">현장 질문 또는 온라인 질문을 선택하세요.</p>
        </div>

        <Tabs defaultValue="onsite" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="onsite" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              현장 질문
            </TabsTrigger>
            <TabsTrigger value="online" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              온라인 질문
            </TabsTrigger>
          </TabsList>

          <TabsContent value="onsite" className="space-y-6">
            {/* Day Filter */}
            <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => setFilterDay(day)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                    filterDay === day
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-white text-muted-foreground border border-border hover:bg-gray-50"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Slots Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
                ))
              ) : (
                PERIODS.map((period) => {
                  const schedule = getSchedule(filterDay, period);
                  const isFull = schedule && schedule.currentCount >= schedule.capacity;
                  const isReserved = schedule?.isReservedByUser;
                  const available = schedule ? schedule.capacity - schedule.currentCount : 4;
                  
                  return (
                    <Card 
                      key={period}
                      onClick={() => {
                        console.log("Slot clicked:", { schedule, isFull, isReserved, filterDay, period });
                        if (schedule && !isFull && !isReserved) {
                          setSelectedSlot({ id: schedule.id, day: filterDay, period, type: 'onsite' });
                        }
                      }}
                      className={cn(
                        "relative overflow-hidden border-2 transition-all duration-200 group cursor-pointer h-32 flex flex-col justify-between p-4",
                        isReserved 
                          ? "bg-emerald-50 border-emerald-200 cursor-default" 
                          : isFull
                            ? "bg-gray-50 border-gray-100 opacity-80 cursor-not-allowed"
                            : "bg-white border-transparent hover:border-primary/50 hover:shadow-lg hover:-translate-y-1"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-muted-foreground">{period}교시</span>
                        {isReserved && <div className="bg-emerald-100 p-1 rounded-full"><Check className="w-3 h-3 text-emerald-600" /></div>}
                        {isFull && !isReserved && <Lock className="w-4 h-4 text-muted-foreground" />}
                      </div>

                      <div className="text-center">
                        {isReserved ? (
                          <span className="text-emerald-700 font-bold text-sm">예약 완료</span>
                        ) : isFull ? (
                          <span className="text-muted-foreground font-medium text-sm">만석</span>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-primary">{available}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">남은 자리</span>
                          </div>
                        )}
                      </div>
                      
                      {!isReserved && (
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full", isFull ? "bg-red-400" : "bg-primary")} 
                            style={{ width: `${schedule ? (schedule.currentCount / schedule.capacity) * 100 : 0}%` }}
                          />
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">※ 현장 질문은 하루 최대 3회로 제한됩니다.</p>
          </TabsContent>

          <TabsContent value="online">
            <Card 
              onClick={() => setSelectedSlot({ id: null, day: "오늘", period: null, type: 'online' })}
              className="p-8 border-2 border-dashed border-primary/20 hover:border-primary/50 cursor-pointer transition-all flex flex-col items-center justify-center gap-4 bg-primary/5"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-lg">온라인 질문하기</h3>
                <p className="text-sm text-muted-foreground mt-1">시간 제한 없이 언제든 질문을 남길 수 있습니다.</p>
              </div>
              <Button className="rounded-xl">질문 사진 업로드</Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedSlot && (
        <ReservationModal 
          scheduleId={selectedSlot.id} 
          day={selectedSlot.day} 
          period={selectedSlot.period || 0} 
          type={selectedSlot.type}
          onClose={() => setSelectedSlot(null)} 
        />
      )}
    </StudentLayout>
  );
}
