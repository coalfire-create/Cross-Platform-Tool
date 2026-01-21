import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const authSchema = z.object({
  phoneNumber: z.string().min(5, "Phone number required"),
  password: z.string().min(4, "Password must be at least 4 characters"),
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Visual Side */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://pixabay.com/get/gccaaa59c2d53ea3a82f4d6f0fbecda8b7b1564350094c1c7b80ad929d6cf891c09658945c6602a3ff491d88079873028e099257217f9d4f3aad46a3dba2e854c_1280.jpg')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        {/* Descriptive comment: Abstract geometric background pattern */}
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <GraduationCap className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold font-display tracking-tight">StudySpace</span>
          </div>
          <h1 className="text-5xl font-display font-bold leading-tight mb-6">
            Your personal space <br /> to <span className="text-accent">excel</span>.
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md leading-relaxed">
            Reserve study spots, manage your schedule, and focus on what matters most. 
            Designed for students who aim higher.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-8 text-center border-t border-white/10 pt-8">
          <div>
            <h3 className="text-3xl font-bold font-display">500+</h3>
            <p className="text-sm opacity-60">Students</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold font-display">24/7</h3>
            <p className="text-sm opacity-60">Access</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold font-display">100%</h3>
            <p className="text-sm opacity-60">Focus</p>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold font-display text-foreground">Welcome Back</h2>
            <p className="text-muted-foreground mt-2">Enter your credentials to access your account.</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 p-1 h-12 bg-secondary rounded-xl">
              <TabsTrigger value="login" className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                Register
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 fade-in">
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="01012345678" {...field} className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors" />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full h-12 rounded-xl font-semibold text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
          {mode === "login" ? "Sign In" : "Create Account"}
          {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
        </Button>
      </form>
    </Form>
  );
}
