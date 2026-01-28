import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase 환경 변수가 설정되지 않았습니다. SUPABASE_URL과 SUPABASE_ANON_KEY를 확인해주세요.');
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

export interface SupabaseAllowedStudent {
  id: number;
  name: string;
  phone_number: string;
  seat_number: number;
}

export async function getSupabaseAllowedStudent(phoneNumber: string): Promise<SupabaseAllowedStudent | null> {
  try {
    const { data, error } = await getSupabase()
      .from('allowed_students')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (error || !data) return null;
    return data;
  } catch (err) {
    console.error('Supabase getAllowedStudent error:', err);
    return null;
  }
}

export async function getSupabaseAllowedStudentsCount(): Promise<number> {
  try {
    const { count, error } = await getSupabase()
      .from('allowed_students')
      .select('*', { count: 'exact', head: true });

    if (error) return 0;
    return count || 0;
  } catch (err) {
    console.error('Supabase getCount error:', err);
    return 0;
  }
}

export async function getAllSupabaseAllowedStudents(): Promise<SupabaseAllowedStudent[]> {
  try {
    const { data, error } = await getSupabase()
      .from('allowed_students')
      .select('*')
      .order('seat_number', { ascending: true });

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error('Supabase getAll error:', err);
    return [];
  }
}
