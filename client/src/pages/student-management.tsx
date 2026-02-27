import { AdminLayout } from "@/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Users, Search, Pencil, Trash2, KeyRound, Loader2, CheckCircle2, XCircle } from "lucide-react";

type AllowedStudentFull = {
  name: string;
  phoneNumber: string;
  seatNumber: number;
  isRegistered: boolean;
  userId: number | null;
};

export default function StudentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editStudent, setEditStudent] = useState<AllowedStudentFull | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<AllowedStudentFull | null>(null);
  const [resetStudent, setResetStudent] = useState<AllowedStudentFull | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phoneNumber: "", seatNumber: "" });
  const [newPassword, setNewPassword] = useState("");

  const { data: students = [], isLoading } = useQuery<AllowedStudentFull[]>({
    queryKey: ["/api/admin/allowed-students-full"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ phoneNumber, data }: { phoneNumber: string; data: any }) => {
      await apiRequest("PATCH", `/api/admin/allowed-students/${encodeURIComponent(phoneNumber)}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/allowed-students-full"] });
      setEditStudent(null);
      toast({ title: "수정 완료", description: "학생 정보가 수정되었습니다." });
    },
    onError: () => toast({ title: "수정 실패", description: "학생 정보 수정에 실패했습니다.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      await apiRequest("DELETE", `/api/admin/allowed-students/${encodeURIComponent(phoneNumber)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/allowed-students-full"] });
      setDeleteStudent(null);
      toast({ title: "삭제 완료", description: "학생이 명단에서 삭제되었습니다." });
    },
    onError: () => toast({ title: "삭제 실패", variant: "destructive" }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number; newPassword: string }) => {
      await apiRequest("POST", `/api/admin/students/${userId}/reset-password`, { newPassword });
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
      s.seatNumber.toString().includes(search)
  );

  const openEdit = (s: AllowedStudentFull) => {
    setEditStudent(s);
    setEditForm({ name: s.name, phoneNumber: s.phoneNumber, seatNumber: s.seatNumber.toString() });
  };

  const formatPhone = (p: string) => p.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold" data-testid="text-page-title">학생 관리</h2>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm" data-testid="text-student-count">
              전체 {students.length}명
            </Badge>
            <Badge variant="secondary" className="text-sm">
              가입 {students.filter(s => s.isRegistered).length}명
            </Badge>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="이름 또는 좌석번호로 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white"
            data-testid="input-search"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-sm table-fixed" data-testid="table-students">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-2 px-2 sm:px-4 font-semibold text-muted-foreground w-[52px] sm:w-16">좌석</th>
                  <th className="text-left py-2 px-2 sm:px-4 font-semibold text-muted-foreground w-[60px] sm:w-auto">이름</th>
                  <th className="text-left py-2 px-2 sm:px-4 font-semibold text-muted-foreground hidden sm:table-cell">전화번호</th>
                  <th className="text-center py-2 px-1 sm:px-4 font-semibold text-muted-foreground w-[40px] sm:w-16">가입</th>
                  <th className="text-right py-2 px-1 sm:px-4 font-semibold text-muted-foreground w-[100px] sm:w-36">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      {search ? "검색 결과가 없습니다." : "등록된 학생이 없습니다."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((student) => (
                    <tr key={student.phoneNumber} className="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors" data-testid={`row-student-${student.seatNumber}`}>
                      <td className="py-2 px-2 sm:px-4">
                        <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary font-bold text-xs" data-testid={`text-seat-${student.seatNumber}`}>
                          {student.seatNumber}
                        </span>
                      </td>
                      <td className="py-2 px-2 sm:px-4 font-medium whitespace-nowrap text-sm" data-testid={`text-name-${student.seatNumber}`}>{student.name}</td>
                      <td className="py-2 px-2 sm:px-4 text-muted-foreground hidden sm:table-cell" data-testid={`text-phone-${student.seatNumber}`}>{formatPhone(student.phoneNumber)}</td>
                      <td className="py-2 px-1 sm:px-4 text-center">
                        {student.isRegistered ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="py-2 px-1 sm:px-4 text-right">
                        <div className="flex items-center justify-end gap-0 sm:gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => openEdit(student)} data-testid={`button-edit-${student.seatNumber}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          {student.isRegistered && student.userId && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => { setResetStudent(student); setNewPassword(""); }} data-testid={`button-reset-${student.seatNumber}`}>
                              <KeyRound className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive" onClick={() => setDeleteStudent(student)} data-testid={`button-delete-${student.seatNumber}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                phoneNumber: editStudent.phoneNumber,
                data: {
                  name: editForm.name,
                  newPhoneNumber: editForm.phoneNumber !== editStudent.phoneNumber ? editForm.phoneNumber : undefined,
                  seatNumber: parseInt(editForm.seatNumber) || editStudent.seatNumber,
                }
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
              <strong>{deleteStudent?.name}</strong> 학생을 명단에서 삭제합니다.
              {deleteStudent?.isRegistered && " 가입된 계정과 모든 질문 기록도 함께 삭제됩니다."}
              {" "}이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteStudent(null)} data-testid="button-delete-cancel">취소</Button>
            <Button
              variant="destructive"
              onClick={() => deleteStudent && deleteMutation.mutate(deleteStudent.phoneNumber)}
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
              onClick={() => resetStudent?.userId && resetPasswordMutation.mutate({ userId: resetStudent.userId, newPassword })}
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