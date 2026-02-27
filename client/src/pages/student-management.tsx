import { AdminLayout } from "@/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Users, Search, Pencil, Trash2, KeyRound, Loader2 } from "lucide-react";

type Student = {
  id: number;
  name: string;
  phoneNumber: string;
  seatNumber: number | null;
  role: string;
  createdAt: string;
};

export default function StudentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [resetStudent, setResetStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phoneNumber: "", seatNumber: "" });
  const [newPassword, setNewPassword] = useState("");

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/admin/students"],
  });

  const updateMutation = useMutation({
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

  const deleteMutation = useMutation({
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

  const filtered = students.filter(
    (s) =>
      s.name.includes(search) ||
      s.phoneNumber.includes(search.replace(/-/g, "")) ||
      (s.seatNumber?.toString() || "").includes(search)
  );

  const openEdit = (s: Student) => {
    setEditStudent(s);
    setEditForm({ name: s.name, phoneNumber: s.phoneNumber, seatNumber: s.seatNumber?.toString() || "" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold" data-testid="text-page-title">학생 관리</h2>
          </div>
          <span className="text-sm text-muted-foreground" data-testid="text-student-count">
            총 {students.length}명
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="이름, 전화번호, 좌석번호로 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search ? "검색 결과가 없습니다." : "등록된 학생이 없습니다."}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((student) => (
              <Card key={student.id} data-testid={`card-student-${student.id}`}>
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
              onClick={() => editStudent && updateMutation.mutate({
                id: editStudent.id,
                data: { name: editForm.name, phoneNumber: editForm.phoneNumber, seatNumber: parseInt(editForm.seatNumber) || 0 }
              })}
              disabled={updateMutation.isPending}
              data-testid="button-edit-save"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              onClick={() => deleteStudent && deleteMutation.mutate(deleteStudent.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-confirm"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              data-testid="input-new-password"
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