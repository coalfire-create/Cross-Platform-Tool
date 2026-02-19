import { useQuery, useMutation } from "@tanstack/react-query";
import { Timetable } from "@shared/schema";
import { StudentLayout } from "@/components/layout";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Upload, Trash2, Maximize2, ImageIcon, CalendarDays } from "lucide-react";
import { useState, useRef } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const CATEGORIES = [
  { value: "elementary", label: "초등관" },
  { value: "middle", label: "중등관" },
];

export default function TimetablePage() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const Layout = isTeacher ? AdminLayout : StudentLayout;

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <CalendarDays className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-timetable-title">시간표</h1>
            <p className="text-sm text-muted-foreground">초등관 / 중등관 시간표를 확인하세요</p>
          </div>
        </div>

        <Tabs defaultValue="elementary">
          <TabsList className="w-full">
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value} className="flex-1" data-testid={`tab-${cat.value}`}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES.map((cat) => (
            <TabsContent key={cat.value} value={cat.value}>
              <CategorySection category={cat.value} label={cat.label} isTeacher={isTeacher} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
}

function CategorySection({ category, label, isTeacher }: { category: string; label: string; isTeacher: boolean }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: timetables, isLoading } = useQuery<Timetable[]>({
    queryKey: ["/api/timetables", category],
    queryFn: async () => {
      const res = await fetch(`/api/timetables/${category}`);
      if (!res.ok) throw new Error("조회 실패");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/timetables/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timetables", category] });
      toast({ title: "삭제 완료", description: "시간표 사진이 삭제되었습니다." });
    },
    onError: () => {
      toast({ title: "삭제 실패", variant: "destructive" });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      const res = await fetch("/api/timetables", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "업로드 실패");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/timetables", category] });
      toast({ title: "업로드 완료", description: `${label} 시간표가 추가되었습니다.` });
    } catch (error: any) {
      toast({ title: "업로드 실패", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {isTeacher && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            data-testid={`input-upload-${category}`}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
            data-testid={`button-upload-${category}`}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? "업로드 중..." : `${label} 시간표 사진 추가`}
          </Button>
        </div>
      )}

      {(!timetables || timetables.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">등록된 시간표가 없습니다</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {timetables.map((item) => (
            <Card key={item.id} className="overflow-hidden" data-testid={`card-timetable-${item.id}`}>
              <CardContent className="p-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="relative group cursor-pointer">
                      <img
                        src={item.photoUrl}
                        alt={`${label} 시간표`}
                        className="w-full object-contain max-h-[500px]"
                        data-testid={`img-timetable-${item.id}`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                        <div className="bg-black/50 text-white p-2 rounded-full">
                          <Maximize2 className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] max-h-[95vh] bg-transparent border-none shadow-none p-0 flex items-center justify-center">
                    <img
                      src={item.photoUrl}
                      alt={`${label} 시간표 전체`}
                      className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain"
                    />
                  </DialogContent>
                </Dialog>

                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t">
                  <span className="text-xs text-muted-foreground">
                    {item.createdAt && format(new Date(item.createdAt), "yyyy년 M월 d일 (EEE) a h:mm", { locale: ko })}
                  </span>
                  {isTeacher && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending}
                      className="text-muted-foreground hover:text-destructive"
                      data-testid={`button-delete-timetable-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
