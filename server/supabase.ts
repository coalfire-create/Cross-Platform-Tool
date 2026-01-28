import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SupabaseAllowedStudent {
  id: number;
  name: string;
  phone_number: string;
  seat_number: number;
}

export async function getSupabaseAllowedStudent(phoneNumber: string): Promise<SupabaseAllowedStudent | null> {
  const { data, error } = await supabase
    .from('allowed_students')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getSupabaseAllowedStudentsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('allowed_students')
    .select('*', { count: 'exact', head: true });

  if (error) return 0;
  return count || 0;
}

export async function getAllSupabaseAllowedStudents(): Promise<SupabaseAllowedStudent[]> {
  const { data, error } = await supabase
    .from('allowed_students')
    .select('*')
    .order('seat_number', { ascending: true });

  if (error || !data) return [];
  return data;
}
