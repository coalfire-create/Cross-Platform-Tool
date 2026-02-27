import { StudentLayout } from "@/components/layout";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Loader2, Eye, EyeOff } from "lucide-react";

export default function ChangePassword() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/change-password", { currentPassword, newPassword });
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "변경 완료", description: "비밀번호가 변경되었습니다." });
    },
    onError: (error: any) => {
      const msg = error.message?.includes("현재 비밀번호") ? "현재 비밀번호가 일치하지 않습니다." : "비밀번호 변경에 실패했습니다.";
      toast({ title: "변경 실패", description: msg, variant: "destructive" });
    },
  });

  const isValid = currentPassword.length > 0 && newPassword.length >= 4 && newPassword === confirmPassword;

  return (
    <StudentLayout>
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <KeyRound className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold" data-testid="text-page-title">비밀번호 변경</h2>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div>
              <label className="text-sm font-medium mb-1 block">현재 비밀번호</label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="현재 비밀번호 입력"
                  data-testid="input-current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowCurrent(!showCurrent)}
                  data-testid="button-toggle-current"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">새 비밀번호</label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="4자 이상 입력"
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowNew(!showNew)}
                  data-testid="button-toggle-new"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword.length > 0 && newPassword.length < 4 && (
                <p className="text-xs text-destructive mt-1">비밀번호는 4자 이상이어야 합니다.</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">새 비밀번호 확인</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호 다시 입력"
                data-testid="input-confirm-password"
              />
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive mt-1">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

            <Button
              className="w-full"
              onClick={() => mutation.mutate()}
              disabled={!isValid || mutation.isPending}
              data-testid="button-change-password"
            >
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              비밀번호 변경
            </Button>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}