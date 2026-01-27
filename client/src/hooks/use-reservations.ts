import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useReservations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const history = useQuery({
    queryKey: [api.reservations.myHistory.path],
    queryFn: async () => {
      const res = await fetch(api.reservations.myHistory.path, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch history");
      return api.reservations.myHistory.responses[200].parse(await res.json());
    },
  });

  // Admin view: List all reservations
  const allReservations = useQuery({
    queryKey: [api.reservations.list.path],
    queryFn: async () => {
      const res = await fetch(api.reservations.list.path, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch all reservations");
      return api.reservations.list.responses[200].parse(await res.json());
    },
  });

  const createReservationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof api.reservations.create.input>) => {
      const res = await fetch(api.reservations.create.path, {
        method: api.reservations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 409) throw new Error("Schedule full or already reserved");
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to reserve");
      }
      return api.reservations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.schedules.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.reservations.myHistory.path] });
      toast({ title: "Reserved!", description: "Your seat has been confirmed." });
    },
    onError: (error) => {
      toast({ 
        title: "Reservation failed", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  return {
    history,
    allReservations,
    createReservationMutation,
  };
}
