import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Loader2 } from "lucide-react";
import igangLogo from "@assets/ikanglogo_clean_1771590117803.png";
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

  if (user) {
    if (user.role === 'teacher') setLocation("/dashboard");
    else setLocation("/home");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#7A2425]">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4">
              올빼미<span className="text-amber-300">Q</span>
            </h1>
            <img
              src={igangLogo}
              alt="이강학원"
              className="w-16 h-16 object-contain mx-auto opacity-80"
              data-testid="img-igang-logo"
            />
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 p-1 h-11 bg-white/10 rounded-xl border border-white/5">
                <TabsTrigger
                  value="login"
                  className="rounded-lg text-sm font-semibold text-white/70 data-[state=active]:bg-white data-[state=active]:text-[#7A2425] data-[state=active]:shadow-sm transition-all"
                  data-testid="tab-login"
                >
                  로그인
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-lg text-sm font-semibold text-white/70 data-[state=active]:bg-white data-[state=active]:text-[#7A2425] data-[state=active]:shadow-sm transition-all"
                  data-testid="tab-register"
                >
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

      <footer className="text-center text-white/30 text-xs pb-6 font-medium">
        영통이강학원
      </footer>
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
              <FormLabel className="text-white/80 text-sm">전화번호</FormLabel>
              <FormControl>
                <Input
                  placeholder="01012345678"
                  {...field}
                  className="h-12 rounded-xl bg-white/10 border-white/15 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/30 transition-colors"
                  data-testid="input-phone"
                />
              </FormControl>
              <FormMessage className="text-amber-300" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/80 text-sm">비밀번호</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                  className="h-12 rounded-xl bg-white/10 border-white/15 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/30 transition-colors"
                  data-testid="input-password"
                />
              </FormControl>
              <FormMessage className="text-amber-300" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl font-semibold text-base bg-white text-[#7A2425] hover:bg-white/90 shadow-lg shadow-black/10 transition-all"
          data-testid="button-submit"
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
          {mode === "login" ? "로그인" : "계정 생성"}
          {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
        </Button>

        {mode === "register" && (
          <p className="text-xs text-white/50 text-center">
            수강생 명단에 등록된 전화번호만 가입 가능합니다
          </p>
        )}
      </form>
    </Form>
  );
}
