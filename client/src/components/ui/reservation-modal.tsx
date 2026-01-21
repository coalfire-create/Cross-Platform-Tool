import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";
import { useState } from "react";
import { useReservations } from "@/hooks/use-reservations";
import { cn } from "@/lib/utils";

interface ReservationModalProps {
  scheduleId: number | null;
  day: string;
  period: number;
  onClose: () => void;
}

export function ReservationModal({ scheduleId, day, period, onClose }: ReservationModalProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const { createReservationMutation } = useReservations();

  const handleSimulatedUpload = () => {
    // Simulate photo upload by picking a random avatar or image
    // In a real app, this would be a file input -> upload endpoint
    const randomId = Math.floor(Math.random() * 1000);
    const mockUrl = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop`; // Generic avatar
    setPhotoUrl(mockUrl);
  };

  const handleConfirm = () => {
    if (scheduleId && photoUrl) {
      createReservationMutation.mutate(
        { scheduleId, photoUrl },
        { onSuccess: onClose }
      );
    }
  };

  return (
    <Dialog open={!!scheduleId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl gap-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-primary">Confirm Reservation</DialogTitle>
          <DialogDescription>
            You are reserving a seat for <span className="font-semibold text-foreground">{day}, Period {period}</span>.
            Please upload a photo to confirm your identity.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center gap-4 py-4">
          {photoUrl ? (
            <div className="relative group">
              <img 
                src={photoUrl} 
                alt="Verification" 
                className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-xl"
              />
              <button 
                onClick={() => setPhotoUrl(null)}
                className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-1.5 shadow-sm hover:scale-110 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div 
              onClick={handleSimulatedUpload}
              className="w-32 h-32 rounded-full border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all group"
            >
              <div className="p-3 bg-secondary rounded-full group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">Take Photo</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto rounded-xl">Cancel</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!photoUrl || createReservationMutation.isPending}
            className="w-full sm:w-auto rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
          >
            {createReservationMutation.isPending ? "Confirming..." : "Complete Reservation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
