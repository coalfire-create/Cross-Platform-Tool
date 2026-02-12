import { useQuery, useMutation } from "@tanstack/react-query";
import { Reservation } from "@shared/schema";
import { StudentLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Loader2, MapPin, Globe, Calendar, Clock, Trash2, Eye, FileText, Image as ImageIcon } from "lucide-react";
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

  // 상태에 따른 뱃지 스타일
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">대기중</Badge>;
      case "confirmed":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">예약 확정</Badge>;
      case "answered":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">답변 완료</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">취소됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">예약 내역</h2>
          <p className="text-muted-foreground">
            신청한 질문 예약 목록입니다.
          </p>
        </div>

        <div className="grid gap-4">
          {reservations?.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
              <p className="text-muted-foreground">아직 예약 내역이 없습니다.</p>
            </div>
          ) : (
            reservations?.map((res) => (
              <Card 
                key={res.id} 
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
                onClick={() => setSelectedReservation(res)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  {/* 아이콘: 현장(주황) / 온라인(파랑) */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    res.type === 'onsite' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {res.type === 'onsite' ? <MapPin className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">
                        {res.type === 'onsite' ? '현장 질문' : '온라인 질문'}
                      </span>
                      {getStatusBadge(res.status)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {res.content === "(내용 없음)" || !res.content ? (
                        <span className="opacity-50">내용 없음</span>
                      ) : (
                        res.content
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(res.createdAt || new Date()), "yyyy년 M월 d일 p", { locale: ko })}
                    </div>
                  </div>

                  {/* 화살표 아이콘 */}
                  <Eye className="w-5 h-5 text-gray-300" />
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 상세보기 모달 */}
        <Dialog open={!!selectedReservation} onOpenChange={(open) => !open && setSelectedReservation(null)}>
          <DialogContent className="sm:max-w-lg bg-white rounded-2xl p-0 overflow-hidden">
            {selectedReservation && (
              <>
                <div className="p-6 pb-0">
                  <DialogHeader className="mb-4">
                    <div className="flex items-center justify-between">
                      <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        {selectedReservation.type === 'onsite' ? (
                          <span className="text-orange-600 flex items-center gap-2">
                            <MapPin className="w-6 h-6" /> 현장 질문
                          </span>
                        ) : (
                          <span className="text-blue-600 flex items-center gap-2">
                            <Globe className="w-6 h-6" /> 온라인 질문
                          </span>
                        )}
                      </DialogTitle>
                      {getStatusBadge(selectedReservation.status)}
                    </div>
                    <DialogDescription className="text-sm text-gray-500 mt-1">
                      {format(new Date(selectedReservation.createdAt || new Date()), "PPP p", { locale: ko })}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* 1. 질문 내용 표시 */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                      <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> 질문 내용
                      </h4>
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {selectedReservation.content === "(내용 없음)" ? (
                          <span className="text-gray-400 italic">작성된 내용이 없습니다.</span>
                        ) : (
                          selectedReservation.content
                        )}
                      </p>
                    </div>

                    {/* ✨ 2. 첨부 사진 표시 (여기가 수정됨!) ✨ */}
                    {selectedReservation.photoUrls && selectedReservation.photoUrls.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                        <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" /> 첨부 사진
                        </h4>
                        <div className="rounded-lg overflow-hidden border border-gray-200">
                          <img 
                            src={selectedReservation.photoUrls[0]} 
                            alt="첨부된 사진" 
                            className="w-full h-auto object-contain max-h-[300px] bg-black/5"
                          />
                        </div>
                      </div>
                    )}

                    {/* 3. 선생님 답변 표시 (답변이 있을 경우에만) */}
                    {selectedReservation.teacherFeedback && (
                      <div className="bg-blue-50 p-4 rounded-xl space-y-2 border border-blue-100">
                        <h4 className="text-sm font-bold text-blue-700 flex items-center gap-2">
                          💬 선생님 답변
                        </h4>
                        <p className="text-blue-900 whitespace-pre-wrap leading-relaxed">
                          {selectedReservation.teacherFeedback}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 하단 버튼 영역 */}
                <div className="bg-gray-50 px-6 py-4 mt-6 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedReservation(null)}>
                    닫기
                  </Button>
                  {selectedReservation.status === 'pending' && (
                    <Button 
                      variant="destructive" 
                      onClick={() => cancelMutation.mutate(selectedReservation.id)}
                      disabled={cancelMutation.isPending}
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