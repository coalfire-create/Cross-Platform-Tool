import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { insertAllowedStudentSchema } from "@shared/schema";

export function useAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const allowedStudents = useQuery({
    queryKey: [api.admin.allowedStudents.list.path],
    queryFn: async () => {
      const res = await fetch(api.admin.allowedStudents.list.path);
      if (!res.ok) throw new Error("Failed to fetch students");
      return api.admin.allowedStudents.list.responses[200].parse(await res.json());
    },
  });

  const addStudentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertAllowedStudentSchema>) => {
      const res = await fetch(api.admin.allowedStudents.create.path, {
        method: api.admin.allowedStudents.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to add student");
      return api.admin.allowedStudents.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.allowedStudents.list.path] });
      toast({ title: "Student added", description: "The student can now register." });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Could not add student. Check if phone number exists.",
        variant: "destructive" 
      });
    },
  });

  return {
    allowedStudents,
    addStudentMutation,
  };
}
