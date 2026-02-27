import { ReactNode } from "react";
import { BottomNav, DesktopNav } from "./bottom-nav";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import owlIcon from "@assets/Gemini_Generated_Image_yxrze7yxrze7yxrz-2_1771590187452.png";

export function StudentLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <DesktopNav />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6 md:py-8 mb-20 md:mb-0">
        <div className="fade-in">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { logoutMutation, user } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={owlIcon} alt="owlQ" className="w-10 h-10 rounded-xl shadow-lg shadow-primary/20" />
          <div>
            <h1 className="font-bold text-lg leading-tight">올빼미Q</h1>
            <p className="text-xs text-muted-foreground">관리자: {user?.name}</p>
          </div>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className={`text-sm font-medium transition-colors ${location === "/dashboard" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            대시보드
          </Link>
          <Link href="/admin/students" className={`text-sm font-medium transition-colors ${location === "/admin/students" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            학생 관리
          </Link>
          <button 
            onClick={() => logoutMutation.mutate()}
            className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
          >
            로그아웃
          </button>
        </nav>
      </header>
      <main className="flex-1 container max-w-6xl mx-auto p-6">
        <div className="fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}