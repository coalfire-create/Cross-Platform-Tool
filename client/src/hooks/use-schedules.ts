import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useSchedules() {
  return useQuery({
    queryKey: [api.schedules.list.path],
    queryFn: async () => {
      const res = await fetch(api.schedules.list.path);
      if (!res.ok) throw new Error("Failed to fetch schedules");
      return api.schedules.list.responses[200].parse(await res.json());
    },
  });
}
