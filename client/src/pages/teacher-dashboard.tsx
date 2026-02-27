import { useQuery, useMutation } from "@tanstack/react-query";
import { ReservationWithDetails } from "@shared/schema";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  Maximize2,
  Camera,
  X,
  Users,
  Search,
  KeyRound,
  Pencil,
  Trash2
} from "lucide-react";
import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

type Student = {
  id: number;
  name: string;
  phoneNumber: string;
  seatNumber: number | null;
  role: string;
  createdAt: string;
};

export default function TeacherDashboard() {
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<{ [key: number]: string }>({});
  const [feedbackImages, setFeedbackImages] = useState<{ [key: number]: File | null }>({});
  const [feedbackPreviews, setFeedbackPreviews] = useState<{ [key: number]: string | null }>({});
  const [studentSearch, setStudentSearch] = useState("");
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [resetStudent, setResetStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phoneNumber: "", seatNumber: "" });
  const [newPassword, setNewPassword] = useState("");

  const { data: reservations, isLoading } = useQuery<ReservationWithDetails[]>({
    queryKey: ["/api/teacher/all"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/admin/students"],
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PATCH", `/api/admin/students/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      setEditStudent(null);
      toast({ title: "수정 완료", description: "학생 정보가 수정되었습니다." });
    },
    onError: () => toast({ title: "수정 실패", variant: "destructive" }),
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      setDeleteStudent(null);
      toast({ title: "삭제 완료", description: "학생 계정이 삭제되었습니다." });
    },
    onError: () => toast({ title: "삭제 실패", variant: "destructive" }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      await apiRequest("POST", `/api/admin/students/${id}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      setResetStudent(null);
      setNewPassword("");
      toast({ title: "초기화 완료", description: "비밀번호가 초기화되었습니다." });
    },
    onError: () => toast({ title: "초기화 실패", variant: "destructive" }),
  });

  const filteredStudents = students.filter(
    (s) =>
      s.name.includes(studentSearch) ||
      s.phoneNumber.includes(studentSearch.replace(/-/g, "")) ||
      (s.seatNumber?.toString() || "").includes(studentSearch)
  );

  const openEdit = (s: Student) => {
    setEditStudent(s);
    setEditForm({ name: s.name, phoneNumber: s.phoneNumber, seatNumber: s.seatNumber?.toString() || "" });
  };

  // 사진 업로드 로직이 포함된 답변 전송 함수
  const respondMutation = useMutation({
    mutationFn: async ({ id, feedbackText }: { id: number; feedbackText: string }) => {
      let photoUrl = "";

      // 1. 만약 사진이 선택되어 있다면 먼저 업로드
      const imageFile = feedbackImages[id];
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("이미지 업로드 실패");
        const data = await res.json();
        photoUrl = data.url;
      }

      // 2. 답변 내용과 사진 URL을 함께 전송
      await apiRequest("PATCH", `/api/reservations/${id}`, {
        status: "answered",
        teacherFeedback: feedbackText,
        teacherPhotoUrl: photoUrl || null, // ✨ DB에 사진 주소 저장
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/all"] });
      toast({ title: "처리 완료", description: "답변과 사진이 전송되었습니다." });

      // 입력창 초기화
      setFeedback(prev => ({ ...prev, [variables.id]: "" }));
      setFeedbackImages(prev => ({ ...prev, [variables.id]: null }));
      setFeedbackPreviews(prev => ({ ...prev, [variables.id]: null }));
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

  // 이미지 선택 핸들러
  const handleImageSelect = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeedbackImages(prev => ({ ...prev, [id]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeedbackPreviews(prev => ({ ...prev, [id]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 삭제 핸들러
  const removeImage = (id: number) => {
    setFeedbackImages(prev => ({ ...prev, [id]: null }));
    setFeedbackPreviews(prev => ({ ...prev, [id]: null }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const pendingReservations = reservations?.filter(r => r.status === 'pending') || [];
  const completedReservations = reservations?.filter(r => 
    r.status === 'answered' && 
    isSameDay(new Date(r.createdAt || new Date()), new Date())
  ) || [];

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* 통계 카드 (기존 동일) */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-white shadow-sm border-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">대기 중인 질문</CardTitle><Clock className="h-4 w-4 text-blue-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-600">{pendingReservations.length}건</div></CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">오늘 처리 완료</CardTitle><CheckCircle2 className="h-4 w-4 text-green-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{completedReservations.length}건</div></CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">현장 질문 대기</CardTitle><MapPin className="h-4 w-4 text-orange-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-orange-600">{pendingReservations.filter(r => r.type === 'onsite').length}건</div></CardContent>
          </Card>
        </div>

        {/* 질문 리스트 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">🚀 답변이 필요한 질문 ({pendingReservations.length})</h2>
          {pendingReservations.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed text-muted-foreground">대기 중인 질문이 없습니다. 잠시 휴식을 취하세요! ☕️</div>
          ) : (
            <div className="grid gap-4">
              {pendingReservations.map((res) => (
                <Card key={res.id} className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">

                      {/* 학생 질문 내용 (기존 동일) */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${res.type === 'onsite' ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-blue-50 text-blue-600 border-blue-200"}`}>
                              {res.type === 'onsite' ? <MapPin className="w-3 h-3" /> : <Globe className="w-3 h-3" />}{res.type === 'onsite' ? "현장 질문" : "온라인 질문"}
                            </Badge>
                            <span className="text-sm text-gray-400">{format(new Date(res.createdAt || new Date()), "p", { locale: ko })} 요청</span>
                          </div>
                          <div className="text-right"><span className="text-lg font-bold mr-2">{res.studentName} 학생</span><Badge variant="secondary" className="text-xs">좌석 {res.seatNumber}</Badge></div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl text-gray-800 leading-relaxed border border-gray-100">{res.content === "(내용 없음)" || !res.content ? <span className="text-gray-400 italic">내용 없음 (사진을 확인하세요)</span> : res.content}</div>

                        {/* 학생 사진 보기 */}
                        {res.photoUrls && res.photoUrls.length > 0 && (
                          <Dialog>
                            <div className="flex flex-col items-start gap-3">
                              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1"><ImageIcon className="w-4 h-4" /> 학생 첨부 사진</h4>
                              <DialogTrigger asChild>
                                <div className="relative group cursor-pointer">
                                  <img src={res.photoUrls[0]} alt="학생 질문 사진" className="w-auto h-36 rounded-xl border border-gray-200 object-cover shadow-sm transition-all group-hover:brightness-90" />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><div className="bg-black/50 text-white p-2 rounded-full"><Maximize2 className="w-5 h-5" /></div></div>
                                </div>
                              </DialogTrigger>
                            </div>
                            <DialogContent className="max-w-4xl bg-transparent border-none shadow-none p-0 flex items-center justify-center">
                              <img src={res.photoUrls[0]} alt="학생 질문 사진 전체" className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain" />
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>

                      {/* 선생님 답변 영역 */}
                      <div className="md:w-80 flex flex-col gap-3 border-l pl-0 md:pl-6 md:border-l-gray-100">
                        {res.type === 'onsite' ? (
                          <div className="h-full flex flex-col justify-center gap-4">
                            <div className="bg-orange-50/80 border border-orange-100 p-5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center shadow-sm">
                              <div className="p-2 bg-white rounded-full shadow-sm"><Footprints className="w-5 h-5 text-orange-500" /></div>
                              <p className="text-orange-900 font-bold text-sm">선생님이 방문하여 지도하는 질문입니다.</p>
                            </div>
                            <Button onClick={() => respondMutation.mutate({ id: res.id, feedbackText: "현장 질문 확인 및 지도 완료" })} disabled={respondMutation.isPending} className="w-full py-6 text-lg font-bold bg-orange-500 hover:bg-orange-600 shadow-orange-200 shadow-lg transition-transform active:scale-95">
                              {respondMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "확인 완료 (지도 끝)"}
                            </Button>
                            <Button variant="ghost" onClick={() => cancelMutation.mutate(res.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50"><XCircle className="w-4 h-4 mr-2" /> 예약 취소시키기</Button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3 h-full">
                            <label className="text-sm font-bold flex items-center gap-2 text-blue-700"><MessageCircle className="w-4 h-4" /> 답변 작성</label>

                            {/* 답변 텍스트 입력 */}
                            <Textarea
                              placeholder="답변을 입력하세요..."
                              value={feedback[res.id] || ""}
                              onChange={(e) => setFeedback({ ...feedback, [res.id]: e.target.value })}
                              className="flex-1 min-h-[100px] resize-none border-blue-100 focus:border-blue-400"
                            />

                            {/* ✨ [추가] 답변 사진 업로드 UI */}
                            <div>
                              <input 
                                id={`teacher-file-${res.id}`} 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleImageSelect(res.id, e)} 
                              />

                              {feedbackPreviews[res.id] ? (
                                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-blue-200 group">
                                  <img src={feedbackPreviews[res.id]!} alt="Preview" className="w-full h-full object-cover" />
                                  <div className="absolute top-1 right-1 bg-black/60 p-1 rounded-full cursor-pointer hover:bg-red-500 transition-colors" onClick={() => removeImage(res.id)}>
                                    <X className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full border-dashed border-blue-300 text-blue-500 hover:bg-blue-50"
                                  onClick={() => document.getElementById(`teacher-file-${res.id}`)?.click()}
                                >
                                  <Camera className="w-4 h-4 mr-2" /> 풀이 사진 첨부하기
                                </Button>
                              )}
                            </div>

                            <div className="flex gap-2 mt-auto pt-2">
                              <Button variant="outline" onClick={() => cancelMutation.mutate(res.id)} className="flex-1 text-gray-500">반려</Button>
                              <Button 
                                onClick={() => respondMutation.mutate({ id: res.id, feedbackText: feedback[res.id] || "답변 완료 (사진 확인)" })} 
                                disabled={respondMutation.isPending || (!feedback[res.id] && !feedbackImages[res.id])} 
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

        {/* 학생 관리 섹션 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2" data-testid="text-student-section">
              <Users className="w-5 h-5" /> 학생 관리 ({students.length}명)
            </h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="이름, 전화번호, 좌석번호로 검색"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="pl-10 bg-white"
              data-testid="input-student-search"
            />
          </div>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-white rounded-xl border border-dashed">
              {studentSearch ? "검색 결과가 없습니다." : "등록된 학생이 없습니다."}
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="bg-white shadow-sm" data-testid={`card-student-${student.id}`}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm" data-testid={`text-seat-${student.id}`}>
                        {student.seatNumber || "-"}
                      </div>
                      <div>
                        <p className="font-semibold" data-testid={`text-name-${student.id}`}>{student.name}</p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-phone-${student.id}`}>
                          {student.phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(student)} data-testid={`button-edit-${student.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setResetStudent(student); setNewPassword(""); }} data-testid={`button-reset-${student.id}`}>
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteStudent(student)} className="text-destructive hover:text-destructive" data-testid={`button-delete-${student.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 학생 정보 수정 다이얼로그 */}
      <Dialog open={!!editStudent} onOpenChange={() => setEditStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>학생 정보 수정</DialogTitle>
            <DialogDescription>학생의 이름, 전화번호, 좌석번호를 수정할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">이름</label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} data-testid="input-edit-name" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">전화번호</label>
              <Input value={editForm.phoneNumber} onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })} data-testid="input-edit-phone" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">좌석번호</label>
              <Input type="number" value={editForm.seatNumber} onChange={(e) => setEditForm({ ...editForm, seatNumber: e.target.value })} data-testid="input-edit-seat" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStudent(null)} data-testid="button-edit-cancel">취소</Button>
            <Button
              onClick={() => editStudent && updateStudentMutation.mutate({
                id: editStudent.id,
                data: { name: editForm.name, phoneNumber: editForm.phoneNumber, seatNumber: parseInt(editForm.seatNumber) || 0 }
              })}
              disabled={updateStudentMutation.isPending}
              data-testid="button-edit-save"
            >
              {updateStudentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 학생 삭제 다이얼로그 */}
      <Dialog open={!!deleteStudent} onOpenChange={() => setDeleteStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>학생 삭제</DialogTitle>
            <DialogDescription>
              <strong>{deleteStudent?.name}</strong> 학생의 계정과 모든 질문 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteStudent(null)} data-testid="button-delete-cancel">취소</Button>
            <Button
              variant="destructive"
              onClick={() => deleteStudent && deleteStudentMutation.mutate(deleteStudent.id)}
              disabled={deleteStudentMutation.isPending}
              data-testid="button-delete-confirm"
            >
              {deleteStudentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 비밀번호 초기화 다이얼로그 */}
      <Dialog open={!!resetStudent} onOpenChange={() => setResetStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비밀번호 초기화</DialogTitle>
            <DialogDescription><strong>{resetStudent?.name}</strong> 학생의 비밀번호를 초기화합니다.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium mb-1 block">새 비밀번호</label>
            <Input
              type="password"
              placeholder="4자 이상 입력"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              data-testid="input-reset-password"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetStudent(null)} data-testid="button-reset-cancel">취소</Button>
            <Button
              onClick={() => resetStudent && resetPasswordMutation.mutate({ id: resetStudent.id, newPassword })}
              disabled={resetPasswordMutation.isPending || newPassword.length < 4}
              data-testid="button-reset-confirm"
            >
              {resetPasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "초기화"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}