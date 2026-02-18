import { useState } from 'react';

const API = 'http://localhost:3001';

const AVATARS = [
  '🌟', '💫', '⚡', '🔥', '🌈', '💎',
  '🔮', '🌙', '☄️', '🪐', '✨', '🎆',
  '🦋', '🐙', '🦄', '👾', '🚀', '🎸',
];

// ─── Shared input style ───────────────────────────────────────────────────────
const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white ' +
  'placeholder-white/30 outline-none focus:border-[#FF3AF2]/60 focus:ring-1 ' +
  'focus:ring-[#FF3AF2]/40 transition-all text-sm';

const btnPrimary =
  'w-full rounded-xl bg-[#FF3AF2] px-4 py-3 font-heading font-black uppercase ' +
  'tracking-widest text-sm text-white transition-all hover:bg-[#e020d8] ' +
  'active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed';

const btnSecondary =
  'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-heading ' +
  'font-black uppercase tracking-widest text-sm text-white/70 transition-all ' +
  'hover:bg-white/10 hover:text-white active:scale-[0.97]';

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuthScreen({ onAuth }) {
  const [view, setView] = useState('landing'); // 'landing' | 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setUsername('');
    setPassword('');
    setAvatar(AVATARS[0]);
    setError('');
  }

  function goTo(v) {
    resetForm();
    setView(v);
  }

  async function handleGuest() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/guest`, { method: 'POST' });
      const data = await res.json();
      onAuth({ username: data.username, color: data.color, avatar: data.avatar, isGuest: true });
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onAuth({ username: data.username, color: data.color, avatar: data.avatar ?? '🌟', isGuest: false });
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    if (username.trim().length > 15) {
      setError('Username must be 15 characters or fewer.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, avatar }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onAuth({ username: data.username, color: data.color, avatar: data.avatar, isGuest: false });
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-[#0D0D1A]">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-[0.08]" />
      <div className="pointer-events-none absolute inset-0 pattern-stripes" />

      {/* Big background word */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
      >
        <span className="font-heading text-[20rem] font-black uppercase leading-none text-[#FF3AF2] opacity-[0.035]">
          HEIYO
        </span>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm animate-appear px-4">
        <p className="mb-8 text-center font-heading text-4xl font-black uppercase tracking-tighter text-gradient">
          Heiyo
        </p>

        {view === 'landing' && (
          <div className="flex flex-col gap-3">
            <button className={btnPrimary} onClick={() => goTo('register')}>
              Create Account
            </button>
            <button className={btnSecondary} onClick={() => goTo('login')}>
              Sign In
            </button>
            <div className="flex items-center gap-3 my-1">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/30 uppercase tracking-widest">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <button
              className={btnSecondary + ' text-white/50'}
              onClick={handleGuest}
              disabled={loading}
            >
              Continue as Guest
            </button>
          </div>
        )}

        {(view === 'login' || view === 'register') && (
          <form
            onSubmit={view === 'login' ? handleLogin : handleRegister}
            className="flex flex-col gap-3"
          >
            <p className="text-center text-xs uppercase tracking-widest text-white/40 mb-1">
              {view === 'login' ? 'Welcome back' : 'New account'}
            </p>

            {/* Avatar picker — register only */}
            {view === 'register' && (
              <div>
                <p className="mb-2 text-center text-[10px] uppercase tracking-widest text-white/30">
                  Pick your avatar
                </p>
                <div className="grid grid-cols-6 gap-1.5">
                  {AVATARS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setAvatar(em)}
                      className="flex items-center justify-center rounded-xl text-xl transition-all"
                      style={{
                        aspectRatio: '1',
                        background: avatar === em ? 'rgba(255,58,242,0.25)' : 'rgba(255,255,255,0.04)',
                        border: avatar === em ? '2px solid #FF3AF2' : '2px solid transparent',
                        boxShadow: avatar === em ? '0 0 10px #FF3AF288' : 'none',
                        transform: avatar === em ? 'scale(1.15)' : 'scale(1)',
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              <input
                className={inputCls}
                placeholder="Username"
                maxLength={15}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                autoFocus
                autoComplete="username"
              />
              {view === 'register' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/25">
                  {username.length}/15
                </span>
              )}
            </div>

            <input
              className={inputCls}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              autoComplete={view === 'login' ? 'current-password' : 'new-password'}
            />

            {error && (
              <p className="text-center text-xs text-[#FF3AF2]">{error}</p>
            )}

            <button
              type="submit"
              className={btnPrimary + ' mt-1'}
              disabled={loading || !username.trim() || !password}
            >
              {loading ? '…' : view === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            <button
              type="button"
              className={btnSecondary}
              onClick={() => goTo('landing')}
              disabled={loading}
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
