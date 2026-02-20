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
    <div className="min-h-screen relative overflow-hidden bg-[hsl(var(--primary))]">
      <img
        src={owlLogo}
        alt="올빼미Q 마스코트"
        className="absolute inset-0 w-full h-full object-contain transition-all duration-[1200ms] ease-out"
        style={{
          opacity: stage >= 1 ? 0.12 : 0,
          transform: stage >= 1 ? "scale(1)" : "scale(1.1)",
        }}
        data-testid="img-owl-logo"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--primary))] via-[hsl(var(--primary))]/60 to-transparent" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-end pb-20 px-6">
        <div className="flex flex-col items-center gap-8">
          <div
            className="transition-all duration-[900ms] ease-out"
            style={{
              opacity: stage >= 1 ? 1 : 0,
              transform: stage >= 1 ? "translateY(0) scale(1)" : "translateY(40px) scale(0.9)",
            }}
          >
            <img
              src={owlLogo}
              alt="올빼미Q"
              className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-2xl brightness-0 invert"
            />
          </div>

          <div
            className="text-center space-y-2 transition-all duration-700 ease-out"
            style={{
              opacity: stage >= 2 ? 1 : 0,
              transform: stage >= 2 ? "translateY(0)" : "translateY(30px)",
            }}
          >
            <h1
              className="text-5xl sm:text-6xl font-display font-extrabold tracking-tight text-white drop-shadow-lg"
              data-testid="text-landing-title"
            >
              올빼미Q
            </h1>
            <p className="text-white/60 text-sm sm:text-base font-medium tracking-widest uppercase">
              영통이강학원
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
              className="h-14 px-14 rounded-full text-base font-bold shadow-2xl hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 gap-2 bg-white text-[hsl(var(--primary))] hover:bg-white/90"
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
        style={{ opacity: stage >= 3 ? 1 : 0 }}
      >
        영통이강학원
      </footer>
    </div>
  );
}
