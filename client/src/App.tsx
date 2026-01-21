import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import StudentHome from "@/pages/student-home";
import StudentReserve from "@/pages/student-reserve";
import StudentHistory from "@/pages/student-history";
import TeacherDashboard from "@/pages/teacher-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/");
    } else if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect based on role if they try to access unauthorized pages
      if (user.role === 'student') setLocation("/home");
      else if (user.role === 'teacher') setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null; // Will redirect in useEffect

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      
      {/* Student Routes */}
      <Route path="/home">
        <ProtectedRoute component={StudentHome} allowedRoles={['student']} />
      </Route>
      <Route path="/reserve">
        <ProtectedRoute component={StudentReserve} allowedRoles={['student']} />
      </Route>
      <Route path="/history">
        <ProtectedRoute component={StudentHistory} allowedRoles={['student']} />
      </Route>

      {/* Teacher/Admin Routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={TeacherDashboard} allowedRoles={['teacher']} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
