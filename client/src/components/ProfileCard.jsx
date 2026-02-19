import { useEffect } from 'react';
import { avatarUrl } from '../utils/avatar.js';
import { statusColor, statusLabel } from '../utils/status.js';

/**
 * ProfileCard — read-only popup for any user.
 *
 * Props:
 *   user        — user object (id, username, color, avatar, tag, bio, statusEmoji, statusText, presenceStatus, displayName)
 *   isSelf      — bool: shows "Edit Profile" footer instead of DM
 *   onClose     — fn
 *   onDm        — fn (called when DM button pressed, only for others)
 *   onEditProfile — fn (opens ProfileEditModal, only for self)
 */
export default function ProfileCard({ user, isSelf, onClose, onDm, onEditProfile }) {
  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const hasStatus = user.statusEmoji || user.statusText;
  const hasBio = user.bio && user.bio.trim().length > 0;
  const presence = user.presenceStatus ?? 'offline';
  const dotColor = statusColor(presence);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,13,26,0.80)', backdropFilter: 'blur(8px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-72 overflow-hidden rounded-3xl bg-[#0D0D1A] animate-appear"
        style={{ boxShadow: `0 0 50px ${user.color}33, 0 8px 32px rgba(0,0,0,0.7)`, border: `2px solid ${user.color}44` }}
      >
        {/* Color banner */}
        <div
          className="h-14 w-full"
          style={{ background: `linear-gradient(135deg, ${user.color}88 0%, ${user.color}22 60%, transparent 100%)` }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 font-heading text-xs font-black text-white/60 hover:bg-black/60 hover:text-white transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Avatar — overlaps the banner */}
        <div className="px-5">
          <div className="-mt-8 mb-3 inline-block">
            <div className="relative">
              <img
                src={avatarUrl(user.avatar)}
                alt={user.username}
                className="h-16 w-16 rounded-full"
                style={{
                  border: `3px solid ${user.color}`,
                  boxShadow: `0 0 20px ${user.color}66`,
                }}
              />
              {user.statusEmoji && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[14px] leading-none"
                  style={{ background: '#0D0D1A', border: `2px solid ${user.color}44` }}
                >
                  {user.statusEmoji}
                </span>
              )}
            </div>
          </div>

          {/* Name row */}
          <div className="mb-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span
              className="font-heading text-base font-black tracking-tight"
              style={{ color: user.color, textShadow: `1px 1px 0 #0D0D1A` }}
            >
              {user.displayName || user.username}
            </span>
            {user.tag && (
              <span className="font-heading text-[10px] font-bold text-white/35">#{user.tag}</span>
            )}
            {/* Presence dot */}
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-heading text-[9px] font-black uppercase tracking-wider"
              style={{ background: `${dotColor}22`, color: dotColor }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor }} />
              {statusLabel(presence)}
            </span>
          </div>

          {/* Username sub-label when display name is set */}
          {user.displayName && (
            <p className="mb-1 font-heading text-[10px] text-white/30">@{user.username}</p>
          )}

          {/* Vibe status */}
          {hasStatus && (
            <div
              className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1"
              style={{ background: `${user.color}15`, border: `1px solid ${user.color}33` }}
            >
              {user.statusEmoji && <span className="text-sm leading-none">{user.statusEmoji}</span>}
              {user.statusText && (
                <span className="font-heading text-[11px] font-bold text-white/70">{user.statusText}</span>
              )}
            </div>
          )}

          {/* Bio */}
          {hasBio && (
            <p className="mb-4 text-sm leading-relaxed text-white/60 whitespace-pre-wrap">
              {user.bio}
            </p>
          )}

          {/* Placeholder when nothing is set */}
          {!hasStatus && !hasBio && !isSelf && (
            <p className="mb-4 font-heading text-xs text-white/25 italic">No profile info yet.</p>
          )}
          {!hasStatus && !hasBio && isSelf && (
            <p className="mb-4 font-heading text-xs text-white/35">
              Add a bio and vibe status to show off your personality!
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3"
          style={{ borderTop: `1px solid ${user.color}22` }}
        >
          {isSelf ? (
            <button
              onClick={() => { onClose(); onEditProfile?.(); }}
              className="w-full rounded-xl border-2 border-dashed border-[#00F5D4] bg-[#00F5D4]/10 py-2 font-heading text-xs font-black uppercase tracking-widest text-[#00F5D4] hover:bg-[#00F5D4]/20 transition-colors"
            >
              ✏️ Edit Profile
            </button>
          ) : (
            <button
              onClick={() => { onClose(); onDm?.(); }}
              className="w-full rounded-xl border-2 border-dashed border-[#FF3AF2] bg-[#FF3AF2]/10 py-2 font-heading text-xs font-black uppercase tracking-widest text-[#FF3AF2] hover:bg-[#FF3AF2]/20 transition-colors"
            >
              💬 Send DM
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
