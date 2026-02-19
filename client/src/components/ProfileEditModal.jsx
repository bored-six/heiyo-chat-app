import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import { avatarUrl } from '../utils/avatar.js';
import { statusColor } from '../utils/status.js';

const BIO_MAX = 160;
const STATUS_TEXT_MAX = 60;
const DISPLAY_NAME_MAX = 32;

const QUICK_EMOJIS = ['🎵', '☕', '🔥', '💤', '🎮', '📚', '✨', '🌙', '🍕', '🚀', '🎨', '💻'];

const PRESENCE_OPTIONS = [
  { value: 'online',    label: 'Online' },
  { value: 'away',      label: 'Away' },
  { value: 'dnd',       label: 'Do Not Disturb' },
  { value: 'invisible', label: 'Invisible' },
];

export default function ProfileEditModal({ onClose }) {
  const { me, socket, setAuthUser } = useChat();

  const [bio, setBio] = useState(me?.bio ?? '');
  const [statusEmoji, setStatusEmoji] = useState(me?.statusEmoji ?? '');
  const [statusText, setStatusText] = useState(me?.statusText ?? '');
  const [presenceStatus, setPresenceStatus] = useState(me?.presenceStatus ?? 'online');
  const [displayName, setDisplayName] = useState(me?.displayName ?? '');

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSave() {
    const payload = {
      bio: bio.trim(),
      statusEmoji: statusEmoji.trim(),
      statusText: statusText.trim(),
      presenceStatus,
      displayName: displayName.trim(),
    };
    socket.emit('profile:update', payload);
    setAuthUser((prev) => ({ ...prev, ...payload }));
    onClose();
  }

  function pickEmoji(e) {
    setStatusEmoji(e);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,13,26,0.88)', backdropFilter: 'blur(10px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl border-4 border-dashed border-[#00F5D4] bg-[#0D0D1A] p-5 animate-appear"
        style={{ boxShadow: '0 0 50px #00F5D433, 0 8px 32px rgba(0,0,0,0.6)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 font-heading text-xs font-black text-white/60 hover:bg-white/20 hover:text-white transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <p className="mb-4 font-heading text-sm font-black uppercase tracking-widest text-[#00F5D4]">
          Edit Profile
        </p>

        {/* Avatar preview */}
        <div className="mb-5 flex items-center gap-3">
          <div className="relative h-14 w-14 flex-shrink-0">
            <img
              src={avatarUrl(me?.avatar)}
              alt={me?.username}
              className="h-14 w-14 rounded-full"
              style={{ border: `2px solid ${me?.color}`, boxShadow: `0 0 16px ${me?.color}66` }}
            />
            {statusEmoji && (
              <span
                className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0D0D1A] text-[13px] leading-none"
                style={{ border: `1.5px solid ${me?.color}44` }}
              >
                {statusEmoji}
              </span>
            )}
          </div>
          <div>
            <p className="font-heading text-sm font-black text-white" style={{ color: me?.color }}>
              {displayName || me?.username}
              {me?.tag && <span className="font-heading text-[10px] font-bold text-white/35 ml-0.5">#{me.tag}</span>}
            </p>
            {displayName && (
              <p className="font-heading text-[9px] text-white/30 mt-0.5">@{me?.username}</p>
            )}
            <p className="font-heading text-[10px] text-white/40 mt-0.5">Live preview above ↑</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Status (presence) */}
          <div>
            <label className="mb-2 block font-heading text-[10px] font-black uppercase tracking-widest text-white/50">
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESENCE_OPTIONS.map(({ value, label }) => {
                const color = statusColor(value);
                const active = presenceStatus === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPresenceStatus(value)}
                    className="flex items-center gap-2 rounded-xl border-2 px-3 py-2 font-heading text-xs font-black transition-all"
                    style={{
                      borderColor: active ? color : 'rgba(255,255,255,0.1)',
                      background: active ? `${color}18` : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: color }} />
                    <span className="text-white/80">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="font-heading text-[10px] font-black uppercase tracking-widest text-white/50">
                Display Name
              </label>
              <span className={`font-heading text-[9px] font-black ${displayName.length > DISPLAY_NAME_MAX - 8 ? 'text-[#FFE600]' : 'text-white/25'}`}>
                {displayName.length}/{DISPLAY_NAME_MAX}
              </span>
            </div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, DISPLAY_NAME_MAX))}
              placeholder={me?.username ?? 'Leave blank to use username'}
              className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-3 py-2 font-heading text-sm text-white placeholder-white/25 outline-none focus:border-[#00F5D4]/50 transition-colors"
            />
            <p className="mt-1 font-heading text-[9px] text-white/30">Shown in chat instead of your username</p>
          </div>

          {/* Vibe status */}
          <div>
            <label className="mb-1 block font-heading text-[10px] font-black uppercase tracking-widest text-white/50">
              Vibe Status
            </label>
            <div className="flex gap-2">
              {/* Emoji trigger */}
              <div className="relative">
                <input
                  type="text"
                  value={statusEmoji}
                  onChange={(e) => setStatusEmoji(e.target.value.slice(0, 2))}
                  placeholder="😊"
                  className="w-12 rounded-xl border-2 border-white/10 bg-white/5 px-2 py-2 text-center text-lg outline-none focus:border-[#00F5D4]/50 transition-colors"
                />
              </div>
              <input
                type="text"
                value={statusText}
                onChange={(e) => setStatusText(e.target.value.slice(0, STATUS_TEXT_MAX))}
                placeholder="deep in code rn"
                className="flex-1 rounded-xl border-2 border-white/10 bg-white/5 px-3 py-2 font-heading text-sm text-white placeholder-white/25 outline-none focus:border-[#00F5D4]/50 transition-colors"
              />
            </div>
            {/* Quick emoji picks */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => pickEmoji(e)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-all hover:scale-110 ${statusEmoji === e ? 'bg-[#00F5D4]/20 ring-1 ring-[#00F5D4]' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  {e}
                </button>
              ))}
              {statusEmoji && (
                <button
                  onClick={() => { setStatusEmoji(''); setStatusText(''); }}
                  className="flex h-7 items-center rounded-lg px-2 font-heading text-[9px] font-black uppercase tracking-wider text-white/40 bg-white/5 hover:bg-white/10 hover:text-white/70 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="font-heading text-[10px] font-black uppercase tracking-widest text-white/50">
                Bio
              </label>
              <span className={`font-heading text-[9px] font-black ${bio.length > BIO_MAX - 20 ? 'text-[#FFE600]' : 'text-white/25'}`}>
                {bio.length}/{BIO_MAX}
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
              placeholder="Say something about yourself…"
              rows={3}
              className="w-full resize-none rounded-xl border-2 border-white/10 bg-white/5 px-3 py-2 font-heading text-sm text-white placeholder-white/25 outline-none focus:border-[#00F5D4]/50 transition-colors leading-relaxed"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-white/15 bg-white/5 py-2.5 font-heading text-xs font-black uppercase tracking-widest text-white/50 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl border-2 border-[#00F5D4] bg-[#00F5D4]/15 py-2.5 font-heading text-xs font-black uppercase tracking-widest text-[#00F5D4] hover:bg-[#00F5D4]/25 transition-colors"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
