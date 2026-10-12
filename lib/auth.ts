import 'server-only';
import { redirect } from 'next/navigation';
import { configured, serverClient } from '@/lib/supabase/server';
export async function getUser() {
  if (!configured()) return null;
  const db = await serverClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  return user;
}
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect('/login');
  return user;
}
export async function isPremium(userId: string) {
  const db = await serverClient();
  const { data } = await db
    .from('subscriptions')
    .select('status,current_period_end')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .maybeSingle();
  return !!data && new Date(data.current_period_end) > new Date();
}
export async function requireAdmin() {
  const user = await requireUser();
  const db = await serverClient();
  const { data } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (data?.role !== 'admin') redirect('/');
  return user;
}
