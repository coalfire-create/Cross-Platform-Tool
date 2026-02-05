import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, FileText, Plus, Loader2 } from "lucide-react"; // Loader2 아이콘 추가
import { useState } from "react";
import { useReservations } from "@/hooks/use-reservations";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/queryClient";

interface ReservationModalProps {
  scheduleId: number | null;
  day: string;
  period: number;
  type: 'onsite' | 'online';
  onClose: () => void;
}

export function ReservationModal({ scheduleId, day, period, type, onClose }: ReservationModalProps) {
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // 혹시 useReservations 훅이 없어서 에러가 난다면, 이 줄을 주석 처리하고 아래 임시 코드를 쓰세요.
  const { createReservationMutation } = useReservations();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file); // 백엔드와 약속된 이름 'file'

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          // credentials: "include", // Replit 환경에서는 이게 오히려 방해가 될 때가 있어 뺐습니다.
        });

        // 🔥 [핵심 수정] 서버가 알려주는 진짜 에러 메시지를 읽습니다.
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: "알 수 없는 서버 오류" }));
          throw new Error(errorData.message || "업로드 실패");
        }

        const data = await res.json();
        console.log("업로드 성공:", data.url);
        uploadedUrls.push(data.url);
      }

      setPhotoUrls(prev => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      console.error("업로드 에러:", err);
      // 사용자에게 진짜 이유를 알려줍니다.
      alert(`사진 업로드 실패: ${err.message}`); 
    } finally {
      setIsUploading(false);
      // 같은 파일을 다시 올릴 수 있게 input 값을 초기화
      e.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    // 내용도 없고 사진도 없으면 막기
    if (!content.trim() && photoUrls.length === 0) {
      alert("질문 내용이나 사진 중 하나는 입력해야 합니다.");
      return;
    }

    const payload: any = { 
      type, 
      content: content.trim() || undefined, 
      photoUrls 
    };

    if (type === 'onsite' && scheduleId) {
      payload.scheduleId = Number(scheduleId);
    }

    console.log("Submitting reservation:", payload);
    createReservationMutation.mutate(
      payload,
      { 
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
          queryClient.invalidateQueries({ queryKey: ["/api/reservations/history"] });
          alert("예약이 완료되었습니다!");
          onClose();
        },
        onError: (error: any) => {
          console.error("Reservation error:", error);
          alert(`예약 실패: ${error.message || "오류가 발생했습니다."}`);
        }
      }
    );
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl gap-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-primary">질문 확인</DialogTitle>
          <DialogDescription>
            {type === 'onsite' ? (
              <><span className="font-semibold text-foreground">{day}, {period}교시 (현장)</span> 질문을 예약합니다.</>
            ) : (
              <><span className="font-semibold text-foreground">온라인 질문</span>을 등록합니다.</>
            )}
            <br />본인 확인 및 질문 확인을 위해 사진을 업로드해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 질문 내용 입력 */}
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
            />
          </div>

          {/* 사진 업로드 영역 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Camera className="w-4 h-4 text-primary" />
              사진 ({photoUrls.length}장)
            </div>

            {/* 업로드된 사진 미리보기 */}
            {photoUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {photoUrls.map((url, index) => (
                  <div key={index} className="relative aspect-video rounded-xl overflow-hidden border-2 border-primary/30 bg-muted group">
                    <img 
                      src={url} 
                      alt={`Photo ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                    <button 
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 업로드 버튼 */}
            <label className={cn(
              "w-full h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group overflow-hidden relative",
              isUploading ? "border-primary/50 bg-primary/5 cursor-not-allowed" : "border-muted-foreground/30 hover:bg-muted/50 hover:border-primary/50"
            )}>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                className="hidden" 
                onChange={handleFileUpload}
                disabled={isUploading}
              />

              {isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="text-xs font-medium text-primary">업로드 중...</span>
                </>
              ) : (
                <>
                  <div className="p-2 bg-secondary rounded-full group-hover:scale-110 transition-transform">
                    {photoUrls.length > 0 ? <Plus className="w-5 h-5 text-primary" /> : <Upload className="w-5 h-5 text-primary" />}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">
                    {photoUrls.length > 0 ? "사진 추가하기" : "사진 업로드하기"}
                  </span>
                </>
              )}
            </label>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto rounded-xl h-11">취소</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={createReservationMutation.isPending || isUploading}
            className="w-full sm:w-auto rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 h-11"
          >
            {createReservationMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 처리 중...</>
            ) : "예약 완료"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}