import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, ArrowRight, Loader2, Users } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const authSchema = z.object({
  phoneNumber: z.string().min(4, "전화번호를 입력해주세요"),
  password: z.string().min(4, "비밀번호는 최소 4자 이상이어야 합니다"),
});

export default function AuthPage() {
  const { loginMutation, registerMutation, user } = useAuth();
  const [, setLocation] = useLocation();
  const [studentCount, setStudentCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/stats/students")
      .then(res => res.json())
      .then(data => setStudentCount(data.count))
      .catch(() => {});
  }, []);

  if (user) {
    if (user.role === 'teacher') setLocation("/dashboard");
    else setLocation("/home");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8 px-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
              <GraduationCap className="w-7 h-7" />
            </div>
            <span className="text-xl font-bold font-display tracking-tight">이강학원</span>
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">
            질문 예약 시스템
          </h1>
          {studentCount !== null && (
            <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
              <Users className="w-4 h-4" />
              <span>현재 수강생 {studentCount}명</span>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-md mx-auto">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 p-1 h-11 bg-secondary rounded-xl">
              <TabsTrigger value="login" className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-login">
                로그인
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all" data-testid="tab-register">
                회원가입
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <AuthForm 
                mode="login" 
                onSubmit={(data) => loginMutation.mutate(data)} 
                isLoading={loginMutation.isPending} 
              />
            </TabsContent>
            <TabsContent value="register">
              <AuthForm 
                mode="register" 
                onSubmit={(data) => registerMutation.mutate(data)} 
                isLoading={registerMutation.isPending} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function AuthForm({ mode, onSubmit, isLoading }: { mode: "login" | "register", onSubmit: (data: any) => void, isLoading: boolean }) {
  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      phoneNumber: "",
      password: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>전화번호</FormLabel>
              <FormControl>
                <Input 
                  placeholder="01012345678" 
                  {...field} 
                  className="h-12 rounded-xl bg-muted/50 border-border focus:bg-background transition-colors" 
                  data-testid="input-phone"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  {...field} 
                  className="h-12 rounded-xl bg-muted/50 border-border focus:bg-background transition-colors" 
                  data-testid="input-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full h-12 rounded-xl font-semibold text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
          data-testid="button-submit"
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
          {mode === "login" ? "로그인" : "계정 생성"}
          {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
        </Button>

        {mode === "register" && (
          <p className="text-xs text-muted-foreground text-center">
            수강생 명단에 등록된 전화번호만 가입 가능합니다
          </p>
        )}
      </form>
    </Form>
  );
}
