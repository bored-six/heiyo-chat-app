import { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import AvatarPickerModal from './AvatarPickerModal.jsx';
import DisplayCatalogueModal from './DisplayCatalogueModal.jsx';
import { avatarUrl } from '../utils/avatar.js';
import { statusColor, statusLabel } from '../utils/status.js';

const BANNER_PRESETS = ['#FF3AF2', '#00F5D4', '#FFE600', '#7B2FFF', '#FF6B35', '#23a55a', '#4A90E2', '#FF4757', '#2ECC71', '#E91E8C', '#F39C12', '#1ABC9C'];
const PRESENCE_OPTIONS = [
  { value: 'online',    label: 'Online' },
  { value: 'away',      label: 'Away' },
  { value: 'dnd',       label: 'Do Not Disturb' },
  { value: 'invisible', label: 'Invisible' },
];

export default function UserBadge() {
  const { me, socket, setAuthUser } = useChat();
  const [open, setOpen] = useState(false);
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const ref = useRef(null);
  const presenceDropdownRef = useRef(null);

  const [bannerColor, setBannerColor] = useState('');
  const [presenceDropdownOpen, setPresenceDropdownOpen] = useState(false);
  const [bannerPickerOpen, setBannerPickerOpen] = useState(false);

  if (!me) return null;

  // Sync banner color from me whenever the panel opens
  useEffect(() => {
    if (open) {
      setBannerColor(me.bannerColor ?? '');
      setPresenceDropdownOpen(false);
      setBannerPickerOpen(false);
    }
  }, [open]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close presence dropdown on outside click
  useEffect(() => {
    if (!presenceDropdownOpen) return;
    function handleClick(e) {
      if (presenceDropdownRef.current && !presenceDropdownRef.current.contains(e.target)) {
        setPresenceDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [presenceDropdownOpen]);

  function handleSaveAvatar(newAvatar) {
    socket.emit('avatar:change', { avatar: newAvatar });
    setAuthUser((prev) => ({ ...prev, avatar: newAvatar }));
  }

  function handlePresenceChange(value) {
    const valid = ['online', 'away', 'dnd', 'invisible'].includes(value) ? value : 'online';
    socket.emit('profile:update', {
      bio: me.bio ?? '',
      statusEmoji: me.statusEmoji ?? '',
      statusText: me.statusText ?? '',
      presenceStatus: valid,
      displayName: me.displayName ?? '',
      bannerColor: me.bannerColor ?? '',
    });
    setAuthUser((prev) => ({ ...prev, presenceStatus: valid }));
    setPresenceDropdownOpen(false);
  }

  function handleBannerColorPick(color) {
    setBannerColor(color);
    socket.emit('profile:update', {
      bio: me.bio ?? '',
      statusEmoji: me.statusEmoji ?? '',
      statusText: me.statusText ?? '',
      presenceStatus: me.presenceStatus ?? 'online',
      displayName: me.displayName ?? '',
      bannerColor: color,
    });
    setAuthUser((prev) => ({ ...prev, bannerColor: color }));
  }

  function handleSignOut() {
    setOpen(false);
    setAuthUser(null);
  }

  function openCatalogue() {
    setOpen(false);
    setCatalogueOpen(true);
  }

  const dotColor = statusColor(me.presenceStatus ?? 'online');

  return (
    <>
      {editingAvatar && (
        <AvatarPickerModal
          currentAvatar={me.avatar}
          onSave={handleSaveAvatar}
          onClose={() => setEditingAvatar(false)}
        />
      )}
      {catalogueOpen && (
        <DisplayCatalogueModal onClose={() => setCatalogueOpen(false)} />
      )}

      <div ref={ref} className="absolute bottom-6 left-6 z-30">

        {/* ── Profile panel ─────────────────────────────────────────── */}
        {open && (
          <div
            className="absolute bottom-full left-0 mb-3 w-72 rounded-2xl border-2 border-dashed border-[#FFE600]/60 bg-[#1a0f36]/95 backdrop-blur-md animate-slide-up overflow-hidden"
            style={{ boxShadow: '0 0 40px rgba(255,230,0,0.15), 0 8px 32px rgba(0,0,0,0.5)' }}
          >

            {/* ── Banner ────────────────────────────────────────────── */}
            <div
              className="h-16 w-full relative overflow-hidden cursor-pointer group/banner"
              onClick={() => setBannerPickerOpen(v => !v)}
              title="Change banner color"
              style={{
                background: bannerColor
                  ? `linear-gradient(135deg, ${bannerColor}cc 0%, ${bannerColor}66 50%, ${bannerColor}22 100%)`
                  : `
                    linear-gradient(135deg, ${me.color}bb 0%, ${me.color}44 35%, transparent 65%),
                    radial-gradient(ellipse at 85% 40%, #7B2FFF66 0%, transparent 55%),
                    radial-gradient(ellipse at 15% 90%, #FF3AF255 0%, transparent 50%),
                    linear-gradient(180deg, #0D0D1A 0%, #1a0f36 100%)
                  `
              }}
            >
              <div className="absolute inset-0 pattern-dots opacity-10" />
              <div
                className="absolute inset-0 opacity-5"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.15) 3px, rgba(255,255,255,0.15) 4px)' }}
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-opacity">
                <span className="rounded-full bg-black/50 px-2.5 py-1 font-heading text-[9px] font-black uppercase tracking-wider text-white/80">
                  🎨 Change Banner
                </span>
              </div>
            </div>

            {/* ── Avatar + Name row ─────────────────────────────────── */}
            {/* Avatar overlaps the banner via -mt-8; name is a separate
                column that starts BELOW the banner so it's always readable */}
            <div className="px-4 flex items-end gap-3 -mt-8 mb-0">
              {/* Avatar — clickable to change */}
              <div
                className="relative h-14 w-14 flex-shrink-0 cursor-pointer group"
                onClick={() => { setEditingAvatar(true); setOpen(false); }}
                title="Change avatar"
              >
                <img
                  src={avatarUrl(me.avatar)}
                  alt={me.username}
                  className="h-14 w-14 rounded-full transition-all duration-150 group-hover:brightness-75"
                  style={{
                    border: `2px solid ${me.color}`,
                    boxShadow: `0 0 16px ${me.color}66, 0 0 0 3px #1a0f36`
                  }}
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <span className="text-lg drop-shadow-lg">🎨</span>
                </div>
                {me.statusEmoji && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[13px] leading-none pointer-events-none select-none"
                    style={{ background: '#1a0f36', border: `2px solid ${me.color}44` }}
                  >
                    {me.statusEmoji}
                  </span>
                )}
              </div>

              {/* Presence — sits at the bottom of the avatar, always below the banner */}
              <div className="relative pb-1" ref={presenceDropdownRef}>
                <button
                  className="flex items-center gap-1.5 rounded-md px-1 hover:bg-white/10 transition-colors group/presence"
                  onClick={() => setPresenceDropdownOpen(v => !v)}
                  title="Change status"
                >
                  <span className="h-2 w-2 rounded-full animate-pulse flex-shrink-0" style={{ background: dotColor }} />
                  <span className="font-heading text-[10px] font-black uppercase tracking-widest" style={{ color: dotColor }}>
                    {statusLabel(me.presenceStatus ?? 'online')}
                  </span>
                  <span className="text-[8px] text-white/30 opacity-0 group-hover/presence:opacity-100 transition-opacity">▾</span>
                </button>
                {presenceDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 z-50 rounded-xl border border-white/10 bg-[#0D0D1A]/98 py-1 shadow-xl min-w-[150px]">
                    {PRESENCE_OPTIONS.map(({ value, label }) => {
                      const color = statusColor(value);
                      const active = me.presenceStatus === value;
                      return (
                        <button
                          key={value}
                          onClick={() => handlePresenceChange(value)}
                          className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-white/10 transition-colors"
                          style={{ background: active ? 'rgba(255,255,255,0.05)' : undefined }}
                        >
                          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
                          <span className="font-heading text-[10px] font-black text-white/80">{label}</span>
                          {active && <span className="ml-auto text-white/40 text-[8px]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Display name — separate row, fully below the banner ── */}
            <div className="px-4 pt-1 pb-2">
              <p
                className="font-heading text-base font-black tracking-tight truncate"
                style={{ color: me.color, textShadow: `0 0 12px ${me.color}88` }}
              >
                {me.displayName || me.username}
                {me.tag && (
                  <span className="font-heading text-[10px] font-bold text-white/35 ml-1">#{me.tag}</span>
                )}
              </p>
              {me.displayName && (
                <p className="font-heading text-[10px] font-bold text-white/40 mt-0.5">@{me.username}</p>
              )}
            </div>

            {/* Banner color picker */}
            {bannerPickerOpen && (
              <div className="px-4 py-3 border-b border-white/10 bg-[#0D0D1A]/60">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-heading text-[9px] font-black uppercase tracking-widest text-white/40">Banner Color</p>
                  <button
                    onClick={() => setBannerPickerOpen(false)}
                    className="font-heading text-[9px] font-black uppercase text-white/30 hover:text-white/60 transition-colors"
                  >
                    Done ✕
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {BANNER_PRESETS.map(color => (
                    <button
                      key={color}
                      onClick={() => handleBannerColorPick(color)}
                      className="h-6 w-6 rounded-md transition-transform hover:scale-110"
                      style={{
                        background: color,
                        boxShadow: bannerColor === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : 'none',
                      }}
                    />
                  ))}
                  <button
                    onClick={() => handleBannerColorPick('')}
                    className="h-6 px-2 rounded-md font-heading text-[8px] font-black uppercase text-white/40 bg-white/5 hover:bg-white/10 hover:text-white/60 transition-colors"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bannerColor || '#7B2FFF'}
                    onChange={(e) => handleBannerColorPick(e.target.value)}
                    className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                    style={{ minWidth: '24px' }}
                  />
                  <span className="font-heading text-[10px] text-white/40">Custom color</span>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="mx-4 h-px bg-white/10" />

            {/* ── View content ────────────────────────────────────────── */}
            <div className="px-4 py-3 space-y-3">

              {/* Transmission pill */}
              {(me.statusEmoji || me.statusText) && (
                <div
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
                  style={{
                    background: `${me.color}15`,
                    border: `1px solid ${me.color}40`
                  }}
                >
                  {me.statusEmoji && <span className="text-sm leading-none">{me.statusEmoji}</span>}
                  {me.statusText && (
                    <span className="font-heading text-[11px] font-bold text-white/70">{me.statusText}</span>
                  )}
                </div>
              )}

              {/* Bio */}
              {me.bio && me.bio.trim() && (
                <p className="text-xs leading-relaxed text-white/55 whitespace-pre-wrap">{me.bio}</p>
              )}

              {/* Empty state */}
              {!me.statusEmoji && !me.statusText && !me.bio && (
                <p className="font-heading text-[10px] text-white/30 italic">
                  No transmission yet.
                </p>
              )}

              {/* Display Catalogue button */}
              <button
                onClick={openCatalogue}
                className="w-full rounded-lg border border-[#00F5D4] bg-[#00F5D4]/10 py-2 font-heading text-[10px] font-black uppercase tracking-widest text-[#00F5D4] hover:bg-[#00F5D4]/20 transition-colors"
              >
                ✦ Display Catalogue
              </button>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-white/10" />

            {/* Account */}
            <div className="px-2 py-2">
              <p className="mb-1 px-3 font-heading text-[9px] font-black uppercase tracking-widest text-white/30">
                Account
              </p>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-150 hover:bg-[#FF3AF2]/10 active:scale-[0.98] group/out"
              >
                <span className="text-base">🚪</span>
                <div>
                  <p className="font-heading text-xs font-black uppercase tracking-wide text-white/80 group-hover/out:text-[#FF3AF2] transition-colors">
                    Sign Out
                  </p>
                  <p className="font-heading text-[9px] text-white/35">Leave the universe</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── Badge pill ──────────────────────────────────────────────── */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-3 rounded-full border-4 border-dashed border-[#FFE600] bg-[#2D1B4E]/90 px-4 py-2 backdrop-blur-sm cursor-pointer transition-transform hover:scale-105 active:scale-95"
          style={{ boxShadow: open ? '0 0 28px rgba(255,230,0,0.6)' : '0 0 20px rgba(255,230,0,0.4)' }}
          aria-label="Open profile menu"
        >
          {/* Avatar */}
          <div className="relative h-10 w-10 flex-shrink-0">
            <img
              src={avatarUrl(me.avatar)}
              alt={me.username}
              className="h-10 w-10 rounded-full"
              style={{ border: '2px solid #FFE600', boxShadow: '0 0 14px #FF3AF288' }}
            />
            {/* Presence dot — bottom-left, dark ring separates it from the avatar */}
            <span
              className="absolute bottom-0 left-0 h-3 w-3 rounded-full pointer-events-none"
              style={{ background: dotColor, boxShadow: '0 0 0 2px #2D1B4E' }}
            />
            {me.statusEmoji && (
              <span
                className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] leading-none pointer-events-none select-none"
                style={{ background: '#2D1B4E', border: '1.5px solid rgba(255,230,0,0.5)' }}
              >
                {me.statusEmoji}
              </span>
            )}
          </div>

          {/* Name */}
          <div>
            <p
              className="font-heading text-sm font-black leading-none tracking-tight text-white"
              style={{ textShadow: `1px 1px 0 ${me.color}` }}
            >
              {me.displayName || me.username}
              {me.tag && (
                <span className="font-heading text-[10px] font-bold normal-case tracking-normal text-white/40 ml-0.5">
                  #{me.tag}
                </span>
              )}
            </p>
            {me.displayName && (
              <p className="font-heading text-[9px] text-white/35">@{me.username}</p>
            )}
            <p className="mt-0.5 font-heading text-[10px] font-black uppercase tracking-widest text-[#00F5D4]">
              Profile ▴
            </p>
          </div>
        </button>

      </div>
    </>
  );
}
