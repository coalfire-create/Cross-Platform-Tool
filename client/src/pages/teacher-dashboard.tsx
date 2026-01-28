import { AdminLayout } from "@/components/layout";
import { useReservations } from "@/hooks/use-reservations";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Filter, CheckCircle, MessageSquare, ExternalLink, Globe, MapPin, ImageIcon, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const DAYS = ["월요일", "화요일", "수요일", "목요일", "금요일", "온라인"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TeacherDashboard() {
  const { allReservations } = useReservations();
  const [filterDay, setFilterDay] = useState<string>("월요일");
  const [filterPeriod, setFilterPeriod] = useState<string>("1");
  const [selectedResId, setSelectedResId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");

  const onsiteReservations = allReservations.data?.filter(res => {
    return res.type === 'onsite' && res.day === filterDay && res.period === parseInt(filterPeriod);
  });

  const onlineReservations = allReservations.data?.filter(res => {
    return res.type === 'online';
  });

  const handleUpdateStatus = async (id: number, status: string, teacherFeedback?: string) => {
    try {
      await apiRequest("PATCH", `/api/reservations/${id}`, { status, teacherFeedback });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      setSelectedResId(null);
      setFeedback("");
    } catch (err) {
      alert("업데이트에 실패했습니다.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-12">
        {/* Onsite Section */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold font-display text-primary">현장 질문 관리</h2>
            </div>
            
            <div className="flex gap-2">
              <Select value={filterDay} onValueChange={setFilterDay}>
                <SelectTrigger className="w-[140px] rounded-xl border-gray-200 bg-white shadow-sm">
                  <SelectValue placeholder="요일" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.filter(d => d !== "온라인").map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-[120px] rounded-xl border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3 h-3 text-muted-foreground" />
                    <SelectValue placeholder="교시" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map(p => <SelectItem key={p} value={p.toString()}>{p}교시</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allReservations.isLoading ? (
               Array.from({length: 4}).map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)
            ) : onsiteReservations && onsiteReservations.length > 0 ? (
              onsiteReservations.map((res) => (
                <ReservationCard key={res.id} res={res} onUpdateStatus={handleUpdateStatus} selectedResId={selectedResId} setSelectedResId={setSelectedResId} feedback={feedback} setFeedback={setFeedback} />
              ))
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground bg-gray-50 rounded-2xl border-2 border-dashed">
                <p>해당 시간대에 예약된 현장 질문이 없습니다.</p>
              </div>
            )}
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Online Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Globe className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold font-display text-primary">온라인 질문 관리</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allReservations.isLoading ? (
               Array.from({length: 4}).map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)
            ) : onlineReservations && onlineReservations.length > 0 ? (
              onlineReservations.map((res) => (
                <ReservationCard key={res.id} res={res} onUpdateStatus={handleUpdateStatus} selectedResId={selectedResId} setSelectedResId={setSelectedResId} feedback={feedback} setFeedback={setFeedback} />
              ))
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground bg-gray-50 rounded-2xl border-2 border-dashed">
                <p>등록된 온라인 질문이 없습니다.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

function ReservationCard({ res, onUpdateStatus, selectedResId, setSelectedResId, feedback, setFeedback }: any) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  
  const photoUrls = res.photoUrls || [];
  const hasPhotos = photoUrls.length > 0;
  const currentPhoto = photoUrls[currentPhotoIndex];
  const hasImageError = imageErrors.has(currentPhotoIndex);

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex(prev => (prev + 1) % photoUrls.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex(prev => (prev - 1 + photoUrls.length) % photoUrls.length);
  };
  
  return (
    <Card className={cn(
      "rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 border-2",
      res.status === 'confirmed' || res.status === 'answered' ? "border-emerald-100 bg-emerald-50/10" : "border-border/60"
    )}>
      <CardContent className="p-0">
        {hasPhotos && (
          <div className="relative h-48 bg-secondary/30 group">
            {hasImageError ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground">
                <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                <span className="text-xs">이미지를 불러올 수 없습니다</span>
                <span className="text-xs opacity-70">(HEIC 형식 미지원)</span>
              </div>
            ) : (
              <img 
                src={currentPhoto} 
                alt={res.studentName} 
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={() => handleImageError(currentPhotoIndex)}
              />
            )}
            <div className="absolute top-2 right-2 flex gap-2">
              <div className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-primary shadow-sm">
                좌석 {res.seatNumber}
              </div>
              {photoUrls.length > 1 && (
                <div className="bg-black/50 backdrop-blur px-2 py-1 rounded-lg text-xs font-medium text-white">
                  {currentPhotoIndex + 1}/{photoUrls.length}
                </div>
              )}
            </div>
            {photoUrls.length > 1 && (
              <>
                <button 
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            <a 
              href={currentPhoto} 
              target="_blank" 
              rel="noreferrer"
              className="absolute bottom-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
        <div className="p-4">
          {!hasPhotos && (
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">
                좌석 {res.seatNumber}
              </div>
            </div>
          )}
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg text-foreground truncate">{res.studentName}</h3>
            {res.status !== 'pending' && (
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            )}
          </div>
          {res.content && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2 bg-muted/50 p-2 rounded-lg italic">
              "{res.content}"
            </p>
          )}
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
              {res.day}
            </span>
            {res.type === 'onsite' && (
              <>
                <span>•</span>
                <span>{res.period}교시</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0 flex-col gap-2">
        {hasPhotos && (
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                className="w-full rounded-xl"
                variant="outline"
              >
                <Eye className="w-4 h-4 mr-2" />
                상세보기
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{res.studentName} 학생 질문 ({res.seatNumber}번)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    사진 ({photoUrls.length}장)
                  </div>
                  <div className="space-y-2">
                    {photoUrls.map((url: string, idx: number) => (
                      <div key={idx} className="w-full rounded-xl overflow-hidden border bg-muted">
                        {imageErrors.has(idx) ? (
                          <div className="w-full aspect-video flex flex-col items-center justify-center text-muted-foreground">
                            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                            <span className="text-sm">이미지를 불러올 수 없습니다</span>
                            <a href={url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-1">
                              원본 파일 다운로드
                            </a>
                          </div>
                        ) : (
                          <a href={url} target="_blank" rel="noreferrer">
                            <img 
                              src={url} 
                              className="w-full object-contain max-h-[60vh]" 
                              alt={`Question ${idx + 1}`} 
                              onError={() => handleImageError(idx)}
                            />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {res.content && (
                  <div className="bg-muted p-3 rounded-xl text-sm">
                    <strong>질문 내용:</strong> {res.content}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>{res.day} {res.type === 'onsite' ? `${res.period}교시` : ''}</span>
                  <span>{new Date(res.createdAt).toLocaleString('ko-KR')}</span>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        {res.type === 'onsite' ? (
          <Button 
            className="w-full rounded-xl" 
            variant={res.status === 'confirmed' ? "outline" : "default"}
            disabled={res.status === 'confirmed'}
            onClick={() => onUpdateStatus(res.id, 'confirmed')}
          >
            {res.status === 'confirmed' ? "확인됨" : "확인 완료"}
          </Button>
        ) : (
          <Dialog open={selectedResId === res.id} onOpenChange={(open) => !open && setSelectedResId(null)}>
            <DialogTrigger asChild>
              <Button 
                className="w-full rounded-xl"
                variant={res.status === 'answered' ? "outline" : "default"}
                onClick={() => {
                  setSelectedResId(res.id);
                  setFeedback(res.teacherFeedback || "");
                }}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {res.status === 'answered' ? "답변 수정" : "답변 달기"}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{res.studentName} 학생 질문 답변</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {hasPhotos && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      사진 ({photoUrls.length}장)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {photoUrls.map((url: string, idx: number) => (
                        <div key={idx} className="aspect-video rounded-xl overflow-hidden border bg-muted">
                          {imageErrors.has(idx) ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                              <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                              <a href={url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                                다운로드
                              </a>
                            </div>
                          ) : (
                            <a href={url} target="_blank" rel="noreferrer">
                              <img 
                                src={url} 
                                className="w-full h-full object-cover hover:opacity-80 transition-opacity" 
                                alt={`Question ${idx + 1}`} 
                                onError={() => handleImageError(idx)}
                              />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {res.content && (
                  <div className="bg-muted p-3 rounded-xl text-sm">
                    <strong>질문 내용:</strong> {res.content}
                  </div>
                )}
                <Textarea 
                  placeholder="답변을 입력해주세요..." 
                  className="min-h-[150px] rounded-xl"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button 
                  className="w-full rounded-xl"
                  onClick={() => onUpdateStatus(res.id, 'answered', feedback)}
                >
                  답변 저장
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
}
