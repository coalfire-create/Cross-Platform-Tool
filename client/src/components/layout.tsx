import { ReactNode } from "react";
import { BottomNav, DesktopNav } from "./bottom-nav";
import { useAuth } from "@/hooks/use-auth";

export function StudentLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Teachers get a different layout (full screen, no bottom nav usually)
  // But for this component, let's assume it's for students based on the name.
  
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
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-primary/20">
            T
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Teacher Portal</h1>
            <p className="text-xs text-muted-foreground">{user?.name}</p>
          </div>
        </div>
        <button 
          onClick={() => logoutMutation.mutate()}
          className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
        >
          Sign Out
        </button>
      </header>
      <main className="flex-1 container max-w-6xl mx-auto p-6">
        <div className="fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
