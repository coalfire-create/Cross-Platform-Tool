import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import owlLogo from "@assets/Gemini_Generated_Image_yxrze7yxrze7yxrz_1771582531173.png";
import igangLogo from "@assets/igang_logo.png";

export default function LandingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 700);
    const t3 = setTimeout(() => setStage(3), 1200);
    const t4 = setTimeout(() => setStage(4), 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
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
            className="transition-all duration-[800ms] ease-out mb-2"
            style={{
              opacity: stage >= 1 ? 1 : 0,
              transform: stage >= 1 ? "translateY(0) scale(1)" : "translateY(-30px) scale(0.9)",
            }}
          >
            <img
              src={igangLogo}
              alt="영통이강학원 로고"
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl"
              data-testid="img-igang-logo"
            />
          </div>

          <div className="mb-10" />

          <div
            className="transition-all duration-[900ms] ease-out mb-8"
            style={{
              opacity: stage >= 2 ? 1 : 0,
              transform: stage >= 2 ? "translateY(0) scale(1)" : "translateY(50px) scale(0.85)",
            }}
          >
            <img
              src={owlLogo}
              alt="올빼미 스파르타 마스코트"
              className="w-48 h-48 sm:w-60 sm:h-60 object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              data-testid="img-owl-logo"
            />
          </div>

          <div
            className="text-center transition-all duration-700 ease-out mb-10"
            style={{
              opacity: stage >= 3 ? 1 : 0,
              transform: stage >= 3 ? "translateY(0)" : "translateY(30px)",
            }}
          >
            <h1
              className="text-[2rem] sm:text-[2.5rem] font-display font-extrabold tracking-wide text-white leading-none"
              data-testid="text-landing-title"
            >
              올빼미 스파르타
            </h1>
          </div>

          <div
            className="transition-all duration-700 ease-out"
            style={{
              opacity: stage >= 4 ? 1 : 0,
              transform: stage >= 4 ? "translateY(0)" : "translateY(20px)",
            }}
          >
            <Button
              onClick={() => setLocation("/auth")}
              size="lg"
              variant="secondary"
              className="h-13 px-14 rounded-full text-base font-bold bg-white/95 text-[#4A1A2A] hover:bg-white shadow-xl shadow-black/20 hover:shadow-2xl hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 gap-2"
              data-testid="button-enter"
            >
              입장
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <footer
        className="absolute bottom-6 left-0 right-0 text-center text-xs text-white/30 font-medium transition-opacity duration-700"
        style={{ opacity: stage >= 4 ? 1 : 0 }}
      >
        영통이강학원
      </footer>
    </div>
  );
}
