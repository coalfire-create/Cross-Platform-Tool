import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import igangLogo from "@assets/igang_logo.png";

export default function LandingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 700);
    const t3 = setTimeout(() => setStage(3), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (user) {
    if (user.role === "teacher") setLocation("/dashboard");
    else setLocation("/home");
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-[#6B1A2A] via-[#3D1A3A] to-[#1A1A3D]">
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center">
          <div
            className="transition-all duration-[800ms] ease-out mb-4"
            style={{
              opacity: stage >= 1 ? 1 : 0,
              transform: stage >= 1 ? "translateY(0) scale(1)" : "translateY(-30px) scale(0.9)",
            }}
          >
            <img
              src={igangLogo}
              alt="영통이강학원 로고"
              className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-2xl shadow-2xl shadow-black/40"
              data-testid="img-igang-logo"
            />
          </div>

          <div
            className="text-center transition-all duration-700 ease-out mb-3"
            style={{
              opacity: stage >= 2 ? 1 : 0,
              transform: stage >= 2 ? "translateY(0)" : "translateY(20px)",
            }}
          >
            <h1
              className="text-5xl sm:text-6xl font-extrabold tracking-tight"
              data-testid="text-landing-title"
            >
              <span className="text-white/90">owl</span>
              <span className="text-[#E8A87C]">Q</span>
            </h1>
          </div>

          <div
            className="text-center transition-all duration-500 ease-out mb-12"
            style={{
              opacity: stage >= 2 ? 1 : 0,
              transform: stage >= 2 ? "translateY(0)" : "translateY(10px)",
            }}
          >
            <p className="text-sm sm:text-base text-white/40 tracking-[0.3em] font-medium">
              영통이강학원 질문관리
            </p>
          </div>

          <div
            className="transition-all duration-700 ease-out"
            style={{
              opacity: stage >= 3 ? 1 : 0,
              transform: stage >= 3 ? "translateY(0)" : "translateY(20px)",
            }}
          >
            <Button
              onClick={() => setLocation("/auth")}
              size="lg"
              variant="secondary"
              className="h-13 px-14 rounded-full text-base font-bold bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm shadow-lg shadow-black/10 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 gap-2"
              data-testid="button-enter"
            >
              입장
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <footer
        className="absolute bottom-6 left-0 right-0 text-center text-xs text-white/25 font-medium transition-opacity duration-700"
        style={{ opacity: stage >= 3 ? 1 : 0 }}
      >
        영통이강학원
      </footer>
    </div>
  );
}
