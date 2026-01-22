import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, FileText } from "lucide-react";
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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { createReservationMutation } = useReservations();

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

  const handleConfirm = () => {
    if (photoUrl) {
      const payload: any = { 
        type, 
        content: content.trim() || undefined, 
        photoUrl 
      };
      
      // Only include scheduleId if it's onsite and we have an ID
      if (type === 'onsite' && scheduleId) {
        payload.scheduleId = Number(scheduleId);
      }
      
      console.log("Submitting reservation:", payload);
      createReservationMutation.mutate(
        payload,
        { 
          onSuccess: () => {
            console.log("Reservation successful");
            queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
            queryClient.invalidateQueries({ queryKey: ["/api/reservations/history"] });
            onClose();
          },
          onError: (error: any) => {
            console.error("Reservation error details:", error);
            if (error.message?.includes("401")) {
              alert("세션이 만료되어 자동으로 다시 로그인합니다.");
              // For development, try to re-login with stored credentials or just refresh
              window.location.reload();
            } else {
              alert(`예약 실패: ${error.message || "알 수 없는 오류"}`);
            }
          }
        }
      );
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl gap-6">
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
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="w-4 h-4 text-primary" />
              질문 내용 (선택)
            </div>
            <Textarea 
              placeholder="질문하고 싶은 내용을 간단히 적어주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none rounded-xl border-border focus-visible:ring-primary h-24"
            />
          </div>

          <div className="flex flex-col items-center justify-center gap-4">
            {photoUrl ? (
              <div className="relative group">
                <img 
                  src={photoUrl} 
                  alt="Verification" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-xl"
                />
                <button 
                  onClick={() => setPhotoUrl(null)}
                  className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-1.5 shadow-sm hover:scale-110 transition-transform"
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
                />
                <div className="p-3 bg-secondary rounded-full group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">
                  {isUploading ? "업로드 중..." : "질문 사진 업로드"}
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
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto rounded-xl">취소</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!photoUrl || createReservationMutation.isPending}
            className="w-full sm:w-auto rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
          >
            {createReservationMutation.isPending ? "처리 중..." : "예약 완료"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
