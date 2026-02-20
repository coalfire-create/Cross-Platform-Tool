import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import owlLogo from "@assets/Gemini_Generated_Image_yxrze7yxrze7yxrz_1771582531173.png";

export default function LandingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 800);
    const t3 = setTimeout(() => setStage(3), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (user) {
    if (user.role === "teacher") setLocation("/dashboard");
    else setLocation("/home");
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-6">
          <div
            className="transition-all duration-[900ms] ease-out"
            style={{
              opacity: stage >= 1 ? 1 : 0,
              transform: stage >= 1 ? "translateY(0) scale(1)" : "translateY(50px) scale(0.85)",
            }}
          >
            <img
              src={owlLogo}
              alt="올빼미 스파르타 마스코트"
              className="w-52 h-52 sm:w-64 sm:h-64 object-contain"
              data-testid="img-owl-logo"
            />
          </div>

          <div
            className="text-center transition-all duration-700 ease-out"
            style={{
              opacity: stage >= 2 ? 1 : 0,
              transform: stage >= 2 ? "translateY(0)" : "translateY(30px)",
            }}
          >
            <div className="flex items-center gap-4" data-testid="text-landing-title">
              <span className="text-[2rem] sm:text-[2.5rem] font-display font-extrabold tracking-tight text-foreground leading-none">
                올빼미
              </span>
              <span className="text-2xl sm:text-3xl font-light text-muted-foreground/30 select-none">/</span>
              <span className="text-[2rem] sm:text-[2.5rem] font-display font-extrabold tracking-tight text-foreground leading-none">
                스파르타
              </span>
            </div>
          </div>

          <div
            className="transition-all duration-700 ease-out mt-2"
            style={{
              opacity: stage >= 3 ? 1 : 0,
              transform: stage >= 3 ? "translateY(0)" : "translateY(20px)",
            }}
          >
            <Button
              onClick={() => setLocation("/auth")}
              size="lg"
              className="h-13 px-12 rounded-full text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 gap-2"
              data-testid="button-enter"
            >
              입장
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <footer
        className="absolute bottom-6 left-0 right-0 text-center text-xs text-muted-foreground/40 font-medium transition-opacity duration-700"
        style={{ opacity: stage >= 3 ? 1 : 0 }}
      >
        영통이강학원
      </footer>
    </div>
  );
}
