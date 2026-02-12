import { useQuery, useMutation } from "@tanstack/react-query";
import { Reservation } from "@shared/schema";
import { StudentLayout } from "@/components/layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { 
  Loader2, 
  MapPin, 
  Globe, 
  Clock, 
  Trash2, 
  ChevronRight, 
  ImageIcon, 
  MessageCircle, 
  CalendarDays
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function StudentHistory() {
  const { toast } = useToast();
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // 예약 목록 가져오기
  const { data: reservations, isLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations"],
  });

  // 예약 취소 기능
  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reservations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({ title: "예약 취소", description: "예약이 성공적으로 취소되었습니다." });
      setSelectedReservation(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "취소 실패", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  // 상태 뱃지 디자인 함수 (더 예쁘게 변경)
  const getStatusBadge = (status: string) => {
    const baseClass = "px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5";
    switch (status) {
      case "pending":
        return <span className={`${baseClass} bg-yellow-50 text-yellow-700 border-yellow-100`}><Clock className="w-3 h-3" /> 대기중</span>;
      case "confirmed":
        return <span className={`${baseClass} bg-blue-50 text-blue-700 border-blue-100`}><CalendarDays className="w-3 h-3" /> 예약 확정</span>;
      case "answered":
        return <span className={`${baseClass} bg-green-50 text-green-700 border-green-100`}><MessageCircle className="w-3 h-3" /> 답변 완료</span>;
      case "cancelled":
        return <span className={`${baseClass} bg-gray-50 text-gray-500 border-gray-100`}>취소됨</span>;
      default:
        return <span className={`${baseClass} bg-gray-50 text-gray-700 border-gray-100`}>{status}</span>;
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-end justify-between px-1">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">예약 내역</h2>
            <p className="text-muted-foreground mt-1">
              신청한 질문들의 진행 상황을 확인하세요.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {reservations?.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">예약 내역이 없습니다</h3>
              <p className="text-gray-500 mt-1">궁금한 점이 있다면 질문을 예약해보세요!</p>
            </div>
          ) : (
            reservations?.map((res) => (
              <div 
                key={res.id} 
                className="group relative bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-transparent transition-all duration-300 cursor-pointer active:scale-[0.99]"
                onClick={() => setSelectedReservation(res)}
              >
                <div className="flex items-start gap-5">
                  {/* 왼쪽 아이콘 영역 */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-colors ${
                    res.type === 'onsite' 
                      ? 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 group-hover:from-orange-100 group-hover:to-orange-200' 
                      : 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 group-hover:from-blue-100 group-hover:to-blue-200'
                  }`}>
                    {res.type === 'onsite' ? <MapPin className="w-7 h-7" /> : <Globe className="w-7 h-7" />}
                  </div>

                  {/* 중앙 내용 영역 */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                        {res.type === 'onsite' ? '현장 질문' : '온라인 질문'}
                        {/* 사진이 있으면 클립 아이콘 표시 */}
                        {res.photoUrls && res.photoUrls.length > 0 && (
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </h3>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(res.status)}
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 truncate mb-2 pr-8 leading-relaxed">
                      {res.content === "(내용 없음)" || !res.content ? (
                        <span className="text-gray-400 italic">내용 없음</span>
                      ) : (
                        res.content
                      )}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                      <span>{format(new Date(res.createdAt || new Date()), "yyyy년 M월 d일 (eee)", { locale: ko })}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span>{format(new Date(res.createdAt || new Date()), "p", { locale: ko })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 상세보기 모달 (디자인 개선) */}
        <Dialog open={!!selectedReservation} onOpenChange={(open) => !open && setSelectedReservation(null)}>
          <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            {selectedReservation && (
              <>
                {/* 모달 헤더 */}
                <div className={`px-6 py-5 border-b border-gray-100 flex items-center justify-between ${
                   selectedReservation.type === 'onsite' ? 'bg-orange-50/50' : 'bg-blue-50/50'
                }`}>
                   <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-xl ${
                        selectedReservation.type === 'onsite' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                     }`}>
                       {selectedReservation.type === 'onsite' ? <MapPin className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                     </div>
                     <div>
                       <h3 className="font-bold text-lg leading-none mb-1">
                         {selectedReservation.type === 'onsite' ? '현장 질문 상세' : '온라인 질문 상세'}
                       </h3>
                       <p className="text-xs text-muted-foreground">
                         {format(new Date(selectedReservation.createdAt || new Date()), "PPP p", { locale: ko })}
                       </p>
                     </div>
                   </div>
                   {getStatusBadge(selectedReservation.status)}
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                  {/* 1. 질문 내용 표시 */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      질문 내용
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-2xl text-gray-800 text-sm leading-relaxed whitespace-pre-wrap border border-gray-100">
                      {selectedReservation.content === "(내용 없음)" ? (
                        <span className="text-gray-400 italic">작성된 내용이 없습니다.</span>
                      ) : (
                        selectedReservation.content
                      )}
                    </div>
                  </div>

                  {/* 2. 첨부 사진 표시 */}
                  {selectedReservation.photoUrls && selectedReservation.photoUrls.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        첨부 사진
                      </h4>
                      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                        <img 
                          src={selectedReservation.photoUrls[0]} 
                          alt="첨부된 사진" 
                          className="w-full h-auto object-contain max-h-[350px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* 3. 선생님 답변 표시 */}
                  {selectedReservation.teacherFeedback && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                      <h4 className="text-sm font-bold text-blue-700 flex items-center gap-2">
                        선생님 답변
                      </h4>
                      <div className="bg-blue-50/80 p-5 rounded-2xl text-blue-900 text-sm leading-relaxed whitespace-pre-wrap border border-blue-100 shadow-sm">
                        {selectedReservation.teacherFeedback}
                      </div>
                    </div>
                  )}
                </div>

                {/* 하단 버튼 영역 */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedReservation(null)}
                    className="rounded-xl hover:bg-gray-200"
                  >
                    닫기
                  </Button>
                  {selectedReservation.status === 'pending' && (
                    <Button 
                      variant="destructive" 
                      onClick={() => cancelMutation.mutate(selectedReservation.id)}
                      disabled={cancelMutation.isPending}
                      className="rounded-xl shadow-sm bg-red-500 hover:bg-red-600"
                    >
                      {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-2" /> 예약 취소</>}
                    </Button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </StudentLayout>
  );
}