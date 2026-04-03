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
      <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          <img src={owlIcon} alt="owlQ" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-lg shadow-primary/20 shrink-0" />
          <div className="min-w-0">
            <h1 className="font-bold text-base sm:text-lg leading-tight">올빼미Q</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{user?.name}</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link href="/dashboard" className={`text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${location === "/dashboard" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            대시보드
          </Link>
          <Link href="/admin/students" className={`text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${location === "/admin/students" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            학생관리
          </Link>
          <Link href="/admin/history" className={`text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${location === "/admin/history" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            질문기록
          </Link>
          <button 
            onClick={() => logoutMutation.mutate()}
            className="text-xs sm:text-sm font-medium whitespace-nowrap text-muted-foreground hover:text-destructive transition-colors"
          >
            로그아웃
          </button>
        </nav>
      </header>
      <main className="flex-1 container max-w-6xl mx-auto p-3 sm:p-6">
        <div className="fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}