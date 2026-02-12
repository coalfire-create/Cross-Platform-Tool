import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Reservation } from "@shared/schema";
import { StudentLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MapPin, Globe, Camera, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { isSameDay } from "date-fns";

export default function StudentReserve() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"offline" | "online">("offline");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSuccessView, setShowSuccessView] = useState(false); // 완료 화면 상태
  const [questionContent, setQuestionContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 내 예약 내역 가져오기
  const { data: reservations } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations"],
  });

  // 오늘 현장 질문 횟수 계산
  const todayOfflineCount = reservations?.filter(r => 
    r.type === 'offline' && isSameDay(new Date(r.createdAt || new Date()), new Date())
  ).length || 0;

  const DAILY_LIMIT = 3; 
  const isLimitReached = todayOfflineCount >= DAILY_LIMIT;

  // 상태 초기화 및 모달 닫기 함수
  const handleClose = () => {
    setIsDialogOpen(false);
    setShowSuccessView(false);
    setQuestionContent("");
    setSelectedImage(null);
    setImagePreview(null);
  };

  // 예약 생성 Mutation
  const createReservationMutation = useMutation({
    mutationFn: async () => {
      let photoUrl = "";

      if (selectedImage) {
        const formData = new FormData();
        formData.append("photo", selectedImage);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        photoUrl = data.url;
      }

      const finalContent = questionContent.trim() === "" ? "(내용 없음)" : questionContent;

      await apiRequest("POST", "/api/reservations", {
        type: activeTab, 
        content: finalContent,
        photoUrls: photoUrl ? [photoUrl] : [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      // ✨ [수정됨] 온라인/현장 구분 없이 무조건 완료 화면 보여주기 ✨
      setShowSuccessView(true);
    },
    onError: (error: Error) => {
      toast({ 
        title: "예약 실패", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const QuestionCard = ({ type }: { type: "offline" | "online" }) => {
    const isOffline = type === "offline";
    const isDisabled = isOffline && isLimitReached;

    return (
      <Card className="border-2 border-dashed border-gray-200 shadow-none bg-gray-50/50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className={`p-4 rounded-full ${isOffline ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"}`}>
            {isOffline ? <MapPin className="w-8 h-8" /> : <Globe className="w-8 h-8" />}
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold">
              {isOffline ? "현장 질문하기" : "온라인 질문하기"}
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              {isOffline 
                ? `선생님께 직접 찾아가서 질문합니다.\n(하루 최대 ${DAILY_LIMIT}회 가능)` 
                : "시간 제한 없이 언제든 질문을 남길 수 있습니다."}
            </p>
          </div>

          {isOffline && (
             <div className={`text-sm font-bold px-3 py-1 rounded-full ${isLimitReached ? "bg-red-100 text-red-600" : "bg-gray-200 text-gray-700"}`}>
               오늘 남은 횟수: {Math.max(0, DAILY_LIMIT - todayOfflineCount)} / {DAILY_LIMIT}회
             </div>
          )}

          <Button 
            onClick={() => setIsDialogOpen(true)}
            disabled={isDisabled}
            className={`mt-4 px-8 py-6 text-lg font-bold rounded-full shadow-lg transition-transform active:scale-95 ${
              isOffline 
                ? "bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300" 
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isDisabled ? "금일 한도 초과" : "질문 작성하기"}
          </Button>

          {isDisabled && (
            <p className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              오늘은 더 이상 현장 질문을 예약할 수 없습니다.
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">질문하기</h2>
          <p className="text-muted-foreground">
            현장 질문 또는 온라인 질문을 선택하세요.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-gray-100 rounded-xl mb-6">
            <TabsTrigger 
              value="offline"
              className="rounded-lg text-base font-medium data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all"
            >
              <MapPin className="w-4 h-4 mr-2" />
              현장 질문
            </TabsTrigger>
            <TabsTrigger 
              value="online" 
              className="rounded-lg text-base font-medium data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
            >
              <Globe className="w-4 h-4 mr-2" />
              온라인 질문
            </TabsTrigger>
          </TabsList>

          <TabsContent value="offline" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <QuestionCard type="offline" />
          </TabsContent>

          <TabsContent value="online" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <QuestionCard type="online" />
          </TabsContent>
        </Tabs>

        {/* 모달 (질문 작성 or 예약 완료) */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) handleClose();
          else setIsDialogOpen(true);
        }}>
          <DialogContent className="sm:max-w-md bg-white rounded-2xl overflow-hidden">
            {showSuccessView ? (
              // ✨ [통합 완료 화면] ✨
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-2 ring-8 ${
                  activeTab === 'offline' 
                    ? "bg-orange-50 ring-orange-50/50" 
                    : "bg-blue-50 ring-blue-50/50"
                }`}>
                  <CheckCircle2 className={`w-12 h-12 ${
                    activeTab === 'offline' ? "text-orange-500" : "text-blue-500"
                  }`} />
                </div>
                <div className="space-y-3 px-4">
                  <h2 className="text-2xl font-bold text-gray-900">예약 요청 완료!</h2>
                  <p className="text-gray-600 text-lg leading-relaxed font-medium">
                    해당 시간대의 조교님이 곧 확인할 예정이니<br/>
                    잠시만 기다려주세요.
                  </p>
                </div>
                <div className="w-full px-6 pt-4">
                  <Button 
                    onClick={handleClose}
                    className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all hover:-translate-y-1 ${
                      activeTab === 'offline'
                        ? "bg-orange-500 hover:bg-orange-600 shadow-orange-200"
                        : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                    }`}
                  >
                    확인했습니다
                  </Button>
                </div>
              </div>
            ) : (
              // [질문 작성 화면]
              <>
                <DialogHeader>
                  <DialogTitle className="text-center text-xl font-bold flex flex-col items-center gap-2">
                    {activeTab === 'offline' ? (
                      <span className="text-orange-600 flex items-center gap-2">
                        <MapPin className="w-5 h-5" /> 현장 질문 작성
                      </span>
                    ) : (
                      <span className="text-blue-600 flex items-center gap-2">
                        <Globe className="w-5 h-5" /> 온라인 질문 작성
                      </span>
                    )}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      질문 내용 (선택 사항)
                    </label>
                    <Textarea
                      placeholder="내용을 입력하지 않아도 예약할 수 있습니다."
                      value={questionContent}
                      onChange={(e) => setQuestionContent(e.target.value)}
                      className="min-h-[120px] resize-none border-gray-200 focus:border-primary rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">사진 첨부 (선택)</label>
                    <div 
                      className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors h-40 relative overflow-hidden"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <Camera className="w-8 h-8 mb-2" />
                          <span className="text-xs">클릭하여 사진 업로드</span>
                        </div>
                      )}
                      <input 
                        id="photo-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageSelect}
                      />
                      {imagePreview && (
                        <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70" onClick={(e) => {
                          e.stopPropagation();
                          setImagePreview(null);
                          setSelectedImage(null);
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={() => createReservationMutation.mutate()}
                    disabled={createReservationMutation.isPending} 
                    className={`w-full h-12 text-lg font-bold rounded-xl ${
                      activeTab === 'offline' ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {createReservationMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "예약 완료"
                    )}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </StudentLayout>
  );
}