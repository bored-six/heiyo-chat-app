import { useState, useEffect } from 'react';
import { AVATAR_SEEDS, avatarUrl } from '../utils/avatar.js';

export default function AvatarPickerModal({ currentAvatar, onSave, onClose }) {
  const [selected, setSelected] = useState(currentAvatar);

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const changed = selected !== currentAvatar;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,13,26,0.85)', backdropFilter: 'blur(8px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl border-4 border-dashed border-[#FF3AF2] bg-[#0D0D1A] p-5 animate-appear"
        style={{ boxShadow: '0 0 40px #FF3AF244, 8px 8px 0 #00F5D4' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 font-heading text-xs font-black text-white/60 hover:bg-white/20 hover:text-white transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        <p className="mb-4 font-heading text-sm font-black uppercase tracking-widest text-[#FF3AF2]">
          Change Avatar
        </p>

        {/* Large preview */}
        <div className="mb-4 flex flex-col items-center gap-1">
          <img
            src={avatarUrl(selected)}
            alt={selected}
            className="h-20 w-20 rounded-full transition-all duration-200"
            style={{
              border: '3px solid #FF3AF2',
              boxShadow: '0 0 22px #FF3AF288, 0 0 50px #FF3AF222',
            }}
          />
          <p className="font-heading text-[9px] font-black uppercase tracking-widest text-[#FF3AF2]/70">
            {selected}
          </p>
        </div>

        {/* Picker grid */}
        <div className="grid grid-cols-6 gap-1.5 mb-4">
          {AVATAR_SEEDS.map((seed) => (
            <button
              key={seed}
              type="button"
              title={seed}
              onClick={() => setSelected(seed)}
              className="relative overflow-hidden rounded-xl transition-all duration-150"
              style={{
                aspectRatio: '1',
                border: selected === seed ? '2px solid #FF3AF2' : '2px solid rgba(255,255,255,0.08)',
                boxShadow: selected === seed ? '0 0 10px #FF3AF288' : 'none',
                transform: selected === seed ? 'scale(1.12)' : 'scale(1)',
                background: selected === seed ? 'rgba(255,58,242,0.15)' : 'transparent',
              }}
            >
              <img src={avatarUrl(seed)} alt={seed} className="h-full w-full rounded-xl" loading="lazy" />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 font-heading text-xs font-black uppercase tracking-widest text-white/60 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(selected); onClose(); }}
            disabled={!changed}
            className="flex-1 rounded-xl bg-[#FF3AF2] py-2.5 font-heading text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-[#e020d8] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
