import { useQuery, useMutation } from "@tanstack/react-query";
import { Reservation } from "@shared/schema";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  MapPin, 
  Globe, 
  Clock, 
  CheckCircle2, 
  MessageCircle, 
  ImageIcon, 
  XCircle,
  Footprints,
  Maximize2 // 아이콘 추가
} from "lucide-react";
import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TeacherDashboard() {
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<{ [key: number]: string }>({});

  // 선생님 전용 주소 사용
  const { data: reservations, isLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/teacher/all"],
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, feedbackText }: { id: number; feedbackText: string }) => {
      await apiRequest("PATCH", `/api/reservations/${id}`, {
        status: "answered",
        teacherFeedback: feedbackText,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/all"] });
      toast({ title: "처리 완료", description: "학생에게 답변이 전달되었습니다." });
      setFeedback({});
    },
    onError: (error: Error) => {
      toast({ title: "오류 발생", description: error.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/reservations/${id}`, {
        status: "cancelled",
        teacherFeedback: "선생님에 의해 취소되었습니다.",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/all"] });
      toast({ title: "예약 취소", description: "질문이 취소 처리되었습니다." });
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // 대기 중인 질문 필터링
  const pendingReservations = reservations?.filter(r => r.status === 'pending') || [];

  // '오늘' 처리된 완료 건수만 카운트
  const completedReservations = reservations?.filter(r => 
    r.status === 'answered' && 
    isSameDay(new Date(r.createdAt || new Date()), new Date())
  ) || [];

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-5xl mx-auto">

        {/* 상단 통계 카드 */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-white shadow-sm border-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">대기 중인 질문</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{pendingReservations.length}건</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">오늘 처리 완료</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedReservations.length}건</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">현장 질문 대기</CardTitle>
              <MapPin className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {pendingReservations.filter(r => r.type === 'onsite').length}건
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 대기 중인 질문 리스트 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            🚀 답변이 필요한 질문 ({pendingReservations.length})
          </h2>

          {pendingReservations.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed text-muted-foreground">
              대기 중인 질문이 없습니다. 잠시 휴식을 취하세요! ☕️
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingReservations.map((res) => (
                <Card key={res.id} className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">

                      {/* 1. 질문 정보 섹션 */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${
                              res.type === 'onsite' 
                                ? "bg-orange-50 text-orange-600 border-orange-200" 
                                : "bg-blue-50 text-blue-600 border-blue-200"
                            }`}>
                              {res.type === 'onsite' ? <MapPin className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                              {res.type === 'onsite' ? "현장 질문" : "온라인 질문"}
                            </Badge>
                            <span className="text-sm text-gray-400">
                              {format(new Date(res.createdAt || new Date()), "p", { locale: ko })} 요청
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-bold mr-2">{res.studentName} 학생</span>
                            <Badge variant="secondary" className="text-xs">좌석 {res.seatNumber}</Badge>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl text-gray-800 leading-relaxed border border-gray-100">
                          {res.content === "(내용 없음)" || !res.content ? (
                            <span className="text-gray-400 italic">내용 없음 (사진을 확인하세요)</span>
                          ) : (
                            res.content
                          )}
                        </div>

                        {/* ✨ 사진 미리보기 및 크게 보기 영역 추가 */}
                        {res.photoUrls && res.photoUrls.length > 0 && (
                          <Dialog>
                            <div className="flex flex-col items-start gap-3">
                              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                <ImageIcon className="w-4 h-4" /> 첨부 사진
                              </h4>
                              {/* 미리보기 이미지 (클릭 시 Dialog 오픈) */}
                              <DialogTrigger asChild>
                                <div className="relative group cursor-pointer">
                                  <img 
                                    src={res.photoUrls[0]} 
                                    alt="질문 첨부 사진 미리보기" 
                                    className="w-auto h-36 rounded-xl border border-gray-200 object-cover shadow-sm transition-all group-hover:brightness-90"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-black/50 text-white p-2 rounded-full">
                                      <Maximize2 className="w-5 h-5" />
                                    </div>
                                  </div>
                                </div>
                              </DialogTrigger>

                              {/* 크게 보기 버튼 (Dialog 오픈) */}
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
                                  <Maximize2 className="w-4 h-4" /> 사진 크게 보기
                                </Button>
                              </DialogTrigger>
                            </div>

                            {/* 큰 이미지 Dialog 내용 */}
                            <DialogContent className="max-w-4xl bg-transparent border-none shadow-none p-0 flex items-center justify-center">
                              <img 
                                src={res.photoUrls[0]} 
                                alt="질문 첨부 사진 전체" 
                                className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain"
                              />
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>

                      {/* 2. 선생님 액션 섹션 */}
                      <div className="md:w-80 flex flex-col gap-3 border-l pl-0 md:pl-6 md:border-l-gray-100">

                        {res.type === 'onsite' ? (
                          // 🟧 [현장 질문]
                          <div className="h-full flex flex-col justify-center gap-4">
                            <div className="bg-orange-50/80 border border-orange-100 p-5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center shadow-sm">
                              <div className="p-2 bg-white rounded-full shadow-sm">
                                 <Footprints className="w-5 h-5 text-orange-500" />
                              </div>
                              <p className="text-orange-900 font-bold text-sm">
                                선생님이 방문하여 지도하는 질문입니다.
                              </p>
                            </div>

                            <Button 
                              onClick={() => respondMutation.mutate({ 
                                id: res.id, 
                                feedbackText: "현장 질문 확인 및 지도 완료" 
                              })}
                              disabled={respondMutation.isPending}
                              className="w-full py-6 text-lg font-bold bg-orange-500 hover:bg-orange-600 shadow-orange-200 shadow-lg transition-transform active:scale-95"
                            >
                              {respondMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "확인 완료 (지도 끝)"}
                            </Button>
                            <Button 
                              variant="ghost" 
                              onClick={() => cancelMutation.mutate(res.id)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 mr-2" /> 예약 취소시키기
                            </Button>
                          </div>
                        ) : (
                          // 🟦 [온라인 질문]
                          <div className="flex flex-col gap-3 h-full">
                            <label className="text-sm font-bold flex items-center gap-2 text-blue-700">
                              <MessageCircle className="w-4 h-4" /> 답변 작성
                            </label>
                            <Textarea
                              placeholder="학생에게 보낼 답변을 입력하세요..."
                              value={feedback[res.id] || ""}
                              onChange={(e) => setFeedback({ ...feedback, [res.id]: e.target.value })}
                              className="flex-1 min-h-[100px] resize-none border-blue-100 focus:border-blue-400"
                            />
                            <div className="flex gap-2 mt-auto">
                              <Button 
                                variant="outline" 
                                onClick={() => cancelMutation.mutate(res.id)}
                                className="flex-1 text-gray-500"
                              >
                                반려
                              </Button>
                              <Button 
                                onClick={() => respondMutation.mutate({ 
                                  id: res.id, 
                                  feedbackText: feedback[res.id] || "답변 완료" 
                                })}
                                disabled={respondMutation.isPending || !feedback[res.id]}
                                className="flex-[2] font-bold bg-blue-600 hover:bg-blue-700"
                              >
                                {respondMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "답변 전송"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}