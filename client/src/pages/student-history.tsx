import { StudentLayout } from "@/components/layout";
import { useReservations } from "@/hooks/use-reservations";
import { Calendar, Edit2, Trash2, Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface EditModalProps {
  reservation: any;
  onClose: () => void;
  onSave: (data: { content?: string; photoUrl?: string }) => void;
  isPending: boolean;
}

function EditModal({ reservation, onClose, onSave, isPending }: EditModalProps) {
  const [content, setContent] = useState(reservation.content || "");
  const [photoUrl, setPhotoUrl] = useState(reservation.photoUrl || "");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("업로드 실패");

      const data = await res.json();
      setPhotoUrl(data.url);
    } catch (err) {
      console.error(err);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    onSave({ content: content.trim() || undefined, photoUrl: photoUrl || undefined });
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl gap-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-primary">질문 수정</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="w-4 h-4 text-primary" />
              질문 내용
            </div>
            <Textarea 
              placeholder="질문하고 싶은 내용을 간단히 적어주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none rounded-xl border-border focus-visible:ring-primary h-24"
              data-testid="input-edit-content"
            />
          </div>

          <div className="flex flex-col items-center justify-center gap-4">
            {photoUrl ? (
              <div className="relative group">
                <img 
                  src={photoUrl} 
                  alt="Question" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-xl"
                />
                <button 
                  onClick={() => setPhotoUrl("")}
                  className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-1.5 shadow-sm hover:scale-110 transition-transform"
                  data-testid="button-remove-photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="w-full h-32 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all group overflow-hidden relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  data-testid="input-edit-photo"
                />
                <div className="p-3 bg-secondary rounded-full group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">
                  {isUploading ? "업로드 중..." : "사진 변경"}
                </span>
                {isUploading && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </label>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto rounded-xl" data-testid="button-cancel-edit">
            취소
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isPending || isUploading}
            className="w-full sm:w-auto rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
            data-testid="button-save-edit"
          >
            {isPending ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentHistory() {
  const { history, updateReservationMutation, deleteReservationMutation } = useReservations();
  const [editingReservation, setEditingReservation] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleEdit = (reservation: any) => {
    setEditingReservation(reservation);
  };

  const handleSaveEdit = (data: { content?: string; photoUrl?: string }) => {
    if (editingReservation) {
      updateReservationMutation.mutate(
        { id: editingReservation.id, data },
        { onSuccess: () => setEditingReservation(null) }
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("정말로 이 예약을 삭제하시겠습니까?")) {
      setDeletingId(id);
      deleteReservationMutation.mutate(id, {
        onSettled: () => setDeletingId(null)
      });
    }
  };

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
                key={res.id || idx} 
                className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col gap-4 animate-slide-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
                data-testid={`card-reservation-${res.id}`}
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-bold text-foreground">{res.day}</span>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                      {res.type === 'online' ? '온라인' : '현장'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      res.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      res.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {res.status === 'confirmed' ? '확정' : res.status === 'pending' ? '대기중' : res.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {res.type === 'onsite' && (
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
                        {res.period}
                      </div>
                    )}
                    <div className="flex flex-col">
                      {res.type === 'onsite' ? (
                        <>
                          <span className="text-sm font-medium">{res.period}교시</span>
                          <span className="text-xs text-muted-foreground">현장 질문</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-medium">온라인 질문</span>
                          <span className="text-xs text-muted-foreground">
                            {res.content ? res.content.slice(0, 30) + (res.content.length > 30 ? '...' : '') : '내용 없음'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {res.photoUrl && (
                      <div className="h-10 w-10 rounded-full overflow-hidden border border-border">
                        <img src={res.photoUrl} alt="Question" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(res)}
                      className="h-8 w-8"
                      data-testid={`button-edit-${res.id}`}
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(res.id)}
                      disabled={deletingId === res.id}
                      className="h-8 w-8"
                      data-testid={`button-delete-${res.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {res.teacherFeedback && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <span className="text-xs font-medium text-blue-700">선생님 피드백:</span>
                    <p className="text-sm text-blue-900 mt-1">{res.teacherFeedback}</p>
                  </div>
                )}
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

      {editingReservation && (
        <EditModal
          reservation={editingReservation}
          onClose={() => setEditingReservation(null)}
          onSave={handleSaveEdit}
          isPending={updateReservationMutation.isPending}
        />
      )}
    </StudentLayout>
  );
}
