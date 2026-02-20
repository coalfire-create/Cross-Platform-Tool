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
    <div className="min-h-screen relative overflow-hidden bg-[#ED3124] flex items-center justify-center">
      <div
        className="flex flex-col items-center transition-all ease-out"
        style={{
          opacity: stage === 0 ? 0 : stage <= 2 ? 1 : 0,
          transform:
            stage === 0
              ? "scale(0.85)"
              : stage === 1
                ? "scale(1)"
                : stage === 2
                  ? "scale(1.05)"
                  : "scale(1.1)",
          transitionDuration: stage <= 1 ? "800ms" : "900ms",
        }}
      >
        <img
          src={igangLogo}
          alt="영통이강학원 로고"
          className="w-36 h-36 sm:w-44 sm:h-44 object-contain"
          data-testid="img-igang-logo"
        />
      </div>
    </div>
  );
}
