'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { ArrowRight, Gamepad2, Loader2 } from 'lucide-react';
import { browserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
const schema = z.object({
  email: z.string().email('Please enter a valid email.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(128),
  username: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[a-zA-Z0-9_ ]+$/, 'Use letters, numbers, spaces, or underscores.')
    .optional(),
});
export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const signup = mode === 'signup';
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    const form = new FormData(e.currentTarget);
    try {
      const values = schema.parse({
        email: form.get('email'),
        password: form.get('password'),
        ...(signup ? { username: form.get('username') } : {}),
      });
      const db = browserClient();
      const { data, error } = signup
        ? await db.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
              data: { username: values.username },
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          })
        : await db.auth.signInWithPassword({ email: values.email, password: values.password });
      if (error) throw error;
      if (signup && !data.session) {
        setMessage('Check your email to confirm your account, then come back to play.');
      } else {
        const next = new URLSearchParams(window.location.search).get('next');
        router.push(
          next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\')
            ? next
            : '/profile',
        );
        router.refresh();
      }
    } catch (err) {
      setMessage(
        err instanceof z.ZodError
          ? err.issues[0].message
          : err instanceof Error
            ? err.message
            : 'Unable to sign in.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function google() {
    setBusy(true);
    setMessage('');
    try {
      const { error } = await browserClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Google sign-in is unavailable.');
      setBusy(false);
    }
  }
  return (
    <div className="layout py-14">
      <div className="surface mx-auto max-w-[450px] p-7 sm:p-9">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9ece2] text-[#5c7661]">
          <Gamepad2 />
        </div>
        <p className="eyebrow text-primary">
          {signup ? 'MAKE YOURSELF AT HOME' : 'GOOD TO SEE YOU'}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          {signup ? 'Your happy place awaits.' : 'Welcome back, player.'}
        </h1>
        <p className="mb-7 mt-3 text-sm leading-6 text-muted-foreground">
          {signup
            ? 'Save your scores, build a streak, and find your next favorite.'
            : 'Your next little victory is just a game away.'}
        </p>
        <Button variant="outline" onClick={google} disabled={busy} className="mb-5 w-full">
          <span className="font-bold text-[#4285f4]">G</span> Continue with Google
        </Button>
        <div className="mb-5 flex items-center gap-4 text-[10px] uppercase tracking-widest text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or with email
          <div className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={submit} className="space-y-4">
          {signup && (
            <label className="block text-xs font-semibold">
              Player name
              <input
                name="username"
                className="field mt-2"
                autoComplete="nickname"
                placeholder="What should we call you?"
                required
                minLength={2}
                maxLength={20}
              />
            </label>
          )}
          <label className="block text-xs font-semibold">
            Email
            <input
              type="email"
              name="email"
              className="field mt-2"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="block text-xs font-semibold">
            Password
            <input
              type="password"
              name="password"
              className="field mt-2"
              autoComplete={signup ? 'new-password' : 'current-password'}
              placeholder="At least 8 characters"
              minLength={8}
              maxLength={128}
              required
            />
          </label>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <>
                {signup ? 'Create free account' : 'Log in'}
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>
        {message && (
          <p role="status" className="mt-4 rounded-xl bg-muted p-3 text-sm leading-6">
            {message}
          </p>
        )}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {signup ? 'Already part of the club?' : 'New around here?'}{' '}
          <Link className="font-semibold text-primary" href={signup ? '/login' : '/signup'}>
            {signup ? 'Log in' : 'Join for free'}
          </Link>
        </p>
      </div>
    </div>
  );
}
