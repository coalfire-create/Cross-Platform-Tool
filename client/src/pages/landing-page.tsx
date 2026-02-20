import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import igangLogo from "@assets/igang_logo.png";

export default function LandingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 200);
    const t2 = setTimeout(() => setStage(2), 1800);
    const t3 = setTimeout(() => setStage(3), 2800);
    const t4 = setTimeout(() => {
      if (user) {
        setLocation(user.role === "teacher" ? "/dashboard" : "/home");
      } else {
        setLocation("/auth");
      }
    }, 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [user, setLocation]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#B71C1C] flex items-center justify-center">
      <div
        className="flex flex-col items-center transition-all ease-out"
        style={{
          opacity: stage === 0 ? 0 : stage <= 2 ? 1 : 0,
          transform:
            stage === 0
              ? "scale(0.8)"
              : stage === 1
                ? "scale(1)"
                : stage === 2
                  ? "scale(1.08)"
                  : "scale(1.15)",
          transitionDuration: stage <= 1 ? "800ms" : "900ms",
        }}
      >
        <img
          src={igangLogo}
          alt="영통이강학원 로고"
          className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-3xl shadow-2xl shadow-black/30"
          data-testid="img-igang-logo"
        />
        <p
          className="mt-5 text-white/70 text-sm sm:text-base tracking-[0.25em] font-medium transition-all duration-700"
          style={{
            opacity: stage >= 1 && stage <= 2 ? 1 : 0,
            transform: stage >= 1 ? "translateY(0)" : "translateY(10px)",
          }}
        >
          영통이강학원
        </p>
      </div>
    </div>
  );
}
