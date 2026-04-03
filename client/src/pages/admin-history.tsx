import { useQuery, useMutation } from "@tanstack/react-query";
import { ReservationWithDetails } from "@shared/schema";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  MapPin,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  Maximize2,
  MessageSquare,
  Filter,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type StatusFilter = "all" | "pending" | "answered" | "cancelled";

export default function AdminHistory() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReservationWithDetails | null>(null);

  const { data: reservations = [], isLoading } = useQuery<ReservationWithDetails[]>({
    queryKey: ["/api/teacher/all"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reservations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/all"] });
      setDeleteTarget(null);
      toast({ title: "삭제 완료", description: "질문 기록이 삭제되었습니다." });
    },
    onError: () => {
      toast({ title: "삭제 실패", variant: "destructive" });
    },
  });

  const filtered = reservations.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchSearch =
      !search ||
      r.studentName?.includes(search) ||
      r.seatNumber?.toString().includes(search) ||
      r.content?.includes(search) ||
      r.teacherFeedback?.includes(search);
    return matchStatus && matchSearch;
  });

  const counts = {
    all: reservations.length,
    pending: reservations.filter((r) => r.status === "pending").length,
    answered: reservations.filter((r) => r.status === "answered").length,
    cancelled: reservations.filter((r) => r.status === "cancelled").length,
  };

  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    pending: {
      label: "대기",
      icon: Clock,
      className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    answered: {
      label: "완료",
      icon: CheckCircle2,
      className: "bg-green-50 text-green-700 border-green-200",
    },
    cancelled: {
      label: "취소",
      icon: XCircle,
      className: "bg-gray-50 text-gray-500 border-gray-200",
    },
  };

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">질문 기록</h2>
          <Badge variant="outline" className="ml-1">{reservations.length}건</Badge>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="학생 이름, 좌석, 질문 내용 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white"
              data-testid="input-search-history"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            {(["all", "pending", "answered", "cancelled"] as StatusFilter[]).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                onClick={() => setStatusFilter(s)}
                className="text-xs"
                data-testid={`filter-${s}`}
              >
                {s === "all" ? "전체" : statusConfig[s].label}
                <span className="ml-1 text-xs opacity-70">{counts[s]}</span>
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed text-muted-foreground">
            {search || statusFilter !== "all" ? "검색 결과가 없습니다." : "기록이 없습니다."}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const sc = statusConfig[r.status] || statusConfig["cancelled"];
              const StatusIcon = sc.icon;
              return (
                <Card key={r.id} className="bg-white shadow-sm border hover:shadow-md transition-shadow" data-testid={`card-history-${r.id}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-xs px-2 py-0.5 flex items-center gap-1 ${sc.className}`}>
                            <StatusIcon className="w-3 h-3" />
                            {sc.label}
                          </Badge>
                          <Badge variant="outline" className={`text-xs px-2 py-0.5 flex items-center gap-1 ${r.type === "onsite" ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-blue-50 text-blue-600 border-blue-200"}`}>
                            {r.type === "onsite" ? <MapPin className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                            {r.type === "onsite" ? "현장" : "온라인"}
                          </Badge>
                          <span className="font-bold text-sm">{r.studentName}</span>
                          <span className="text-xs text-muted-foreground">좌석 {r.seatNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {r.createdAt ? format(new Date(r.createdAt), "MM/dd HH:mm", { locale: ko }) : ""}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-red-50"
                            onClick={() => setDeleteTarget(r)}
                            data-testid={`button-delete-${r.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">학생 질문</p>
                          <div className="bg-gray-50 rounded-lg p-3 text-sm leading-relaxed border border-gray-100">
                            {r.content && r.content !== "(내용 없음)"
                              ? r.content
                              : <span className="text-muted-foreground italic">내용 없음</span>}
                          </div>
                          {r.photoUrls && r.photoUrls.length > 0 && (
                            <button
                              className="relative group cursor-pointer inline-block"
                              onClick={() => setExpandedImage(r.photoUrls![0])}
                              data-testid={`img-question-${r.id}`}
                            >
                              <img
                                src={r.photoUrls[0]}
                                alt="질문 사진"
                                className="h-24 w-auto rounded-lg border border-gray-200 object-cover shadow-sm transition-all group-hover:brightness-90"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/50 text-white p-1.5 rounded-full">
                                  <Maximize2 className="w-4 h-4" />
                                </div>
                              </div>
                            </button>
                          )}
                        </div>

                        {(r.teacherFeedback || r.teacherPhotoUrl) && (
                          <div className="flex-1 space-y-2 md:border-l md:pl-4">
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">선생님 답변</p>
                            <div className="bg-blue-50 rounded-lg p-3 text-sm leading-relaxed border border-blue-100 text-blue-900">
                              {r.teacherFeedback || <span className="italic text-blue-400">내용 없음</span>}
                            </div>
                            {r.teacherPhotoUrl && (
                              <button
                                className="relative group cursor-pointer inline-block"
                                onClick={() => setExpandedImage(r.teacherPhotoUrl!)}
                                data-testid={`img-answer-${r.id}`}
                              >
                                <img
                                  src={r.teacherPhotoUrl}
                                  alt="답변 사진"
                                  className="h-24 w-auto rounded-lg border border-blue-200 object-cover shadow-sm transition-all group-hover:brightness-90"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="bg-black/50 text-white p-1.5 rounded-full">
                                    <Maximize2 className="w-4 h-4" />
                                  </div>
                                </div>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
        <DialogContent className="max-w-4xl bg-transparent border-none shadow-none p-0 flex items-center justify-center">
          {expandedImage && (
            <img
              src={expandedImage}
              alt="확대 이미지"
              className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>질문 기록 삭제</DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.studentName}</strong> 학생의 질문 기록을 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} data-testid="button-delete-cancel">
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-confirm"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
