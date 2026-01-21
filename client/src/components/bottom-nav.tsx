import { Link, useLocation } from "wouter";
import { Home, CalendarClock, History, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function BottomNav() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  const navItems = [
    { href: "/home", icon: Home, label: "홈" },
    { href: "/reserve", icon: CalendarClock, label: "예약" },
    { href: "/history", icon: History, label: "기록" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
      <div className="flex justify-around items-center p-2 pb-safe">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 cursor-pointer",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground active:scale-95"
                )}
              >
                <item.icon className={cn("w-6 h-6 mb-1", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
        
        <button
          onClick={() => logoutMutation.mutate()}
          className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-muted-foreground hover:text-destructive transition-colors active:scale-95"
        >
          <LogOut className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">로그아웃</span>
        </button>
      </div>
    </div>
  );
}

export function DesktopNav() {
  const [location] = useLocation();
  const { logoutMutation, user } = useAuth();

  return (
    <header className="hidden md:flex items-center justify-between px-8 py-4 bg-background border-b border-border sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold font-display text-xl">
          L
        </div>
        <h1 className="text-xl font-bold text-primary tracking-tight">이강학웜</h1>
      </div>

      <nav className="flex items-center gap-6">
        <Link href="/home" className={cn("text-sm font-medium transition-colors hover:text-primary", location === "/home" ? "text-primary" : "text-muted-foreground")}>
          대시보드
        </Link>
        <Link href="/reserve" className={cn("text-sm font-medium transition-colors hover:text-primary", location === "/reserve" ? "text-primary" : "text-muted-foreground")}>
          예약하기
        </Link>
        <Link href="/history" className={cn("text-sm font-medium transition-colors hover:text-primary", location === "/history" ? "text-primary" : "text-muted-foreground")}>
          예약 내역
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        <div className="text-sm text-right">
          <p className="font-medium text-foreground">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.role === 'teacher' ? '선생님' : '학생'}</p>
        </div>
        <button
          onClick={() => logoutMutation.mutate()}
          className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
