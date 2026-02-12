import { useQuery, useMutation } from "@tanstack/react-query";
import { Reservation } from "@shared/schema";
import { StudentLayout } from "@/components/layout";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // 입력창 추가
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
  CalendarDays,
  Pencil,
  X,
  Save,
  Camera
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function StudentHistory() {
  const { toast } = useToast();
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // 수정 모드 상태 관리
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  // 예약 목록 가져오기
  const { data: reservations, isLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations"],
  });

  // 모달이 열릴 때 상태 초기화
  useEffect(() => {
    if (selectedReservation) {
      setIsEditing(false);
      setEditContent(selectedReservation.content === "(내용 없음)" ? "" : selectedReservation.content || "");
      setEditImage(null);
      setEditImagePreview(selectedReservation.photoUrls?.[0] || null);
    }
  }, [selectedReservation]);

  // 1. 예약 삭제 (취소) Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reservations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({ title: "삭제 완료", description: "예약이 취소되었습니다." });
      setSelectedReservation(null);
    },
    onError: (error: Error) => {
      toast({ title: "취소 실패", description: error.message, variant: "destructive" });
    },
  });

  // 2. 예약 수정 Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedReservation) return;

      let photoUrl = selectedReservation.photoUrls?.[0] || ""; // 기존 사진 유지

      // 새 사진이 있으면 업로드
      if (editImage) {
        const formData = new FormData();
        formData.append("file", editImage);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("이미지 업로드 실패");
        const data = await res.json();
        photoUrl = data.url;
      }

      const finalContent = editContent.trim() === "" ? "(내용 없음)" : editContent;

      await apiRequest("PATCH", `/api/reservations/${selectedReservation.id}`, {
        content: finalContent,
        photoUrls: photoUrl ? [photoUrl] : [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({ title: "수정 완료", description: "질문 내용이 수정되었습니다." });
      setSelectedReservation(null); // 모달 닫기
    },
    onError: (error: Error) => {
      toast({ title: "수정 실패", description: error.message, variant: "destructive" });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  // 상태 뱃지 UI
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

        {/* 리스트 영역 */}
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
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-colors ${
                    res.type === 'onsite' 
                      ? 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600' 
                      : 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600'
                  }`}>
                    {res.type === 'onsite' ? <MapPin className="w-7 h-7" /> : <Globe className="w-7 h-7" />}
                  </div>

                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                        {res.type === 'onsite' ? '현장 질문' : '온라인 질문'}
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

        {/* 상세 보기 및 수정 모달 */}
        <Dialog open={!!selectedReservation} onOpenChange={(open) => !open && setSelectedReservation(null)}>
          <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            {selectedReservation && (
              <>
                {/* 1. 모달 헤더 */}
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
                         {isEditing ? "질문 수정하기" : (selectedReservation.type === 'onsite' ? '현장 질문 상세' : '온라인 질문 상세')}
                       </h3>
                       <p className="text-xs text-muted-foreground">
                         {format(new Date(selectedReservation.createdAt || new Date()), "PPP p", { locale: ko })}
                       </p>
                     </div>
                   </div>
                   {!isEditing && getStatusBadge(selectedReservation.status)}
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">

                  {/* === 수정 모드 (isEditing === true) === */}
                  {isEditing ? (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-200">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-900">질문 내용 수정</label>
                        <Textarea 
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="수정할 내용을 입력하세요."
                          className="min-h-[120px] resize-none border-gray-200 focus:border-primary rounded-xl bg-gray-50"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-900">사진 수정 (선택)</label>
                        <div 
                          className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors h-48 relative overflow-hidden bg-white"
                          onClick={() => document.getElementById('edit-photo-upload')?.click()}
                        >
                          {editImagePreview ? (
                            <img src={editImagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-contain bg-gray-50" />
                          ) : (
                            <div className="flex flex-col items-center text-gray-400">
                              <Camera className="w-8 h-8 mb-2" />
                              <span className="text-xs">터치하여 사진 변경</span>
                            </div>
                          )}
                          <input 
                            id="edit-photo-upload" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageSelect}
                          />
                          {editImagePreview && (
                            <div className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 z-10" onClick={(e) => {
                              e.stopPropagation();
                              setEditImagePreview(null);
                              setEditImage(null);
                            }}>
                              <X className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* === 조회 모드 (isEditing === false) === */
                    <>
                      {/* 질문 내용 */}
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

                      {/* 첨부 사진 */}
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

                      {/* 선생님 답변 */}
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
                    </>
                  )}
                </div>

                {/* 3. 하단 버튼 영역 */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                  {isEditing ? (
                    // 수정 모드 버튼 (취소, 저장)
                    <>
                      <Button 
                        variant="ghost" 
                        onClick={() => setIsEditing(false)}
                        className="rounded-xl"
                      >
                        취소
                      </Button>
                      <Button 
                        onClick={() => updateMutation.mutate()}
                        disabled={updateMutation.isPending}
                        className="rounded-xl bg-slate-900 hover:bg-slate-800"
                      >
                        {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        저장하기
                      </Button>
                    </>
                  ) : (
                    // 조회 모드 버튼 (닫기, 수정, 삭제)
                    <>
                      <Button 
                        variant="ghost" 
                        onClick={() => setSelectedReservation(null)}
                        className="rounded-xl hover:bg-gray-200"
                      >
                        닫기
                      </Button>

                      {/* 대기중(pending) 상태일 때만 수정/삭제 가능 */}
                      {selectedReservation.status === 'pending' && (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEditing(true)}
                            className="rounded-xl border-gray-300 hover:bg-gray-100"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            수정
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => {
                              if(confirm("정말로 이 예약을 삭제하시겠습니까?")) {
                                deleteMutation.mutate(selectedReservation.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="rounded-xl shadow-sm bg-red-500 hover:bg-red-600"
                          >
                            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-2" /> 삭제</>}
                          </Button>
                        </>
                      )}
                    </>
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