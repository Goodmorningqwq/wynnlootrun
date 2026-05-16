'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AUTH_API = '/api/user/auth';

function getCurrentUser(): string | null {
  try { return localStorage.getItem('currentUser'); } catch { return null; }
}

function setCurrentUser(username: string) {
  localStorage.setItem('currentUser', username);
}

async function registerUser(username: string, password: string) {
  const response = await fetch(`${AUTH_API}?action=register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Registration failed');
  return result;
}

async function loginUser(username: string, password: string) {
  const response = await fetch(`${AUTH_API}?action=login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Login failed');
  return result;
}

type AuthMode = 'login' | 'register';

const MODES: Record<AuthMode, { title: string; btn: string }> = {
  login: { title: 'Login', btn: 'Login' },
  register: { title: 'Register', btn: 'Register' },
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      router.replace('/run');
    }
  }, [router]);

  const handleSubmit = async () => {
    setError('');
    if (!username.trim() || !password) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    try {
      if (mode !== 'login') {
        try {
          await registerUser(username.trim(), password);
        } catch (regErr: unknown) {
          const msg = regErr instanceof Error ? regErr.message : '';
          if (!msg.includes('already exists')) throw regErr;
        }
      }

      const result = await loginUser(username.trim(), password);
      setCurrentUser(result.username || username.trim());

      router.replace('/run');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-[rgba(120,68,190,0.35)]" style={{ backdropFilter: 'blur(10px)', background: 'linear-gradient(180deg, rgba(22,10,35,0.85), rgba(10,5,18,0.9))' }}>
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">⚔️</span>
          <h1 className="text-lg font-bold text-white font-heading">
            WynnLootrun Advisor
          </h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="glow-card rounded-xl p-8">
            <h2 className="text-2xl font-bold text-center mb-6 font-heading" style={{ background: 'linear-gradient(130deg, #f5d0fe 0%, #f472b6 40%, #c084fc 74%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {MODES[mode].title}
            </h2>

            <div className="flex rounded-lg overflow-hidden border border-[rgba(168,85,247,0.24)] mb-6">
              {(['login', 'register'] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(''); }}
                  className={`flex-1 py-2.5 text-xs font-semibold text-center transition-all ${
                    mode === m
                      ? 'bg-gradient-to-br from-[rgba(255,79,216,0.22)] to-[rgba(124,58,237,0.28)] text-white'
                      : 'text-[var(--color-wynn-text-muted)] hover:text-white hover:bg-[rgba(255,79,216,0.05)]'
                  }`}
                >
                  {m === 'login' ? 'Login' : 'Register'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-[var(--color-wynn-text-muted)] text-sm mb-1">Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="bg-[rgba(10,6,20,0.92)] border-[rgba(192,132,252,0.45)] text-white placeholder:text-[rgba(163,154,191,0.5)] focus:border-[rgba(232,121,249,0.9)] focus:ring-[rgba(236,72,153,0.2)]"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>
              <div>
                <Label className="text-[var(--color-wynn-text-muted)] text-sm mb-1">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="bg-[rgba(10,6,20,0.92)] border-[rgba(192,132,252,0.45)] text-white placeholder:text-[rgba(163,154,191,0.5)] focus:border-[rgba(232,121,249,0.9)] focus:ring-[rgba(236,72,153,0.2)]"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 text-sm font-semibold bg-gradient-to-br from-[var(--color-wynn-pink)] to-[var(--color-wynn-purple-dark)] hover:opacity-90 border border-[rgba(232,121,249,0.75)] text-white"
              >
                {loading ? 'Please wait...' : MODES[mode].btn}
              </Button>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
