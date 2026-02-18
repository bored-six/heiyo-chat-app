import { useRef, useState } from 'react';
import { useChat } from '../context/ChatContext.jsx';

const MAX_CHARS = 2000;
const TYPING_TIMEOUT_MS = 2000;

export default function MessageInput({ roomId, toUserId, accent = '#FF3AF2', clash = '#FFE600' }) {
  const { socket } = useChat();
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const isTypingRef = useRef(false);
  const typingTimerRef = useRef(null);

  // ── Typing indicator helpers ─────────────────────────────────────────────

  function emitTypingStart() {
    if (!roomId || isTypingRef.current) return;
    isTypingRef.current = true;
    socket.emit('typing:start', { roomId });
  }

  function emitTypingStop() {
    if (!roomId || !isTypingRef.current) return;
    clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    socket.emit('typing:stop', { roomId });
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleChange(e) {
    setText(e.target.value);
    const ta = textareaRef.current;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    emitTypingStart();
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(emitTypingStop, TYPING_TIMEOUT_MS);
  }

  function send() {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_CHARS) return;
    emitTypingStop();
    if (roomId)      socket.emit('message:send', { roomId, text: trimmed });
    else if (toUserId) socket.emit('dm:send', { toUserId, text: trimmed });
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // ── Derived state ────────────────────────────────────────────────────────

  const nearLimit = text.length > 1800;
  const overLimit = text.length > MAX_CHARS;

  // SVG ring constants
  const RING_RADIUS = 22;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const ringOffset = RING_CIRCUMFERENCE * (1 - text.length / MAX_CHARS);
  const ringColor = overLimit ? '#ff4444' : nearLimit ? '#FFE600' : accent;

  return (
    <div className="flex-shrink-0 p-4">
      {/* Input container */}
      <div
        className="flex items-end gap-3 rounded-3xl border-4 p-3 transition-all duration-300"
        style={{
          borderColor: overLimit ? '#ff4444' : accent,
          backgroundColor: 'rgba(45,27,78,0.6)',
          boxShadow: overLimit
            ? '0 0 20px rgba(255,68,68,0.5)'
            : `0 0 20px ${accent}44`,
        }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={roomId ? 'TRANSMIT…' : 'DIRECT TRANSMISSION…'}
          className="flex-1 resize-none bg-transparent font-heading text-sm font-bold uppercase tracking-wide text-white placeholder-white/20 outline-none"
          style={{ minHeight: '24px', maxHeight: '120px' }}
        />
        {/* SVG ring + circular send button + counter */}
        <div className="flex flex-shrink-0 flex-col items-center gap-0.5">
          <div className="relative" style={{ width: 52, height: 52 }}>
            <svg
              width="52" height="52" viewBox="0 0 52 52"
              className="absolute inset-0 -rotate-90 pointer-events-none"
            >
              {/* Track */}
              <circle cx="26" cy="26" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              {/* Progress */}
              <circle
                cx="26" cy="26" r={RING_RADIUS}
                fill="none"
                stroke={ringColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={ringOffset}
                style={{ transition: 'stroke-dashoffset 0.15s ease-out, stroke 0.2s' }}
              />
            </svg>
            <button
              onClick={send}
              disabled={!text.trim() || overLimit}
              className="absolute inset-[4px] rounded-full border-2 font-heading text-lg font-black text-white transition-all duration-200 hover:scale-110 disabled:cursor-not-allowed disabled:opacity-30"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${clash})`,
                borderColor: clash,
                boxShadow: `0 0 14px ${accent}66`,
              }}
              aria-label="Send message"
            >
              ↑
            </button>
          </div>
          <span
            className="font-heading text-[9px] font-bold tabular-nums transition-all duration-200"
            style={{
              color: overLimit ? '#ff4444' : nearLimit ? '#FFE600' : 'rgba(255,255,255,0.3)',
              opacity: text.length > 0 ? 1 : 0,
            }}
          >
            {text.length}/2000
          </span>
        </div>
      </div>

      <p className="mt-1.5 px-2 font-heading text-[10px] font-bold uppercase tracking-widest text-white/18">
        Enter to send · Shift+Enter for line break
      </p>
    </div>
  );
}
