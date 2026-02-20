import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import owlLogo from "@assets/Gemini_Generated_Image_yxrze7yxrze7yxrz_1771582531173.png";

export default function LandingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (user) {
    if (user.role === "teacher") setLocation("/dashboard");
    else setLocation("/home");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/[0.03] blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent/[0.03] blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-110" />
          <img
            src={owlLogo}
            alt="올빼미Q 마스코트"
            className="relative w-40 h-40 sm:w-48 sm:h-48 object-contain drop-shadow-lg"
            data-testid="img-owl-logo"
          />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-foreground" data-testid="text-landing-title">
            올빼미Q
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg font-medium">
            영통이강학원
          </p>
        </div>

        <Button
          onClick={() => setLocation("/auth")}
          size="lg"
          className="h-14 px-10 rounded-2xl text-base font-bold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 gap-2"
          data-testid="button-enter"
        >
          입장
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>

      <footer className="absolute bottom-6 text-xs text-muted-foreground/50 font-medium">
        영통이강학원
      </footer>
    </div>
  );
}
