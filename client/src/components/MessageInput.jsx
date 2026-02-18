import { useRef, useState } from 'react';
import { useChat } from '../context/ChatContext.jsx';

const MAX_CHARS = 2000;
const TYPING_TIMEOUT_MS = 2000;

export default function MessageInput({ roomId, toUserId }) {
  const { socket } = useChat();
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const isTypingRef = useRef(false);
  const typingTimerRef = useRef(null);

  // ── Typing indicator helpers ────────────────────────────────────────────────

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

  // ── Change handler ──────────────────────────────────────────────────────────

  function handleChange(e) {
    setText(e.target.value);

    // Auto-grow textarea up to ~5 lines
    const ta = textareaRef.current;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';

    emitTypingStart();
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(emitTypingStop, TYPING_TIMEOUT_MS);
  }

  // ── Send ───────────────────────────────────────────────────────────────────

  function send() {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_CHARS) return;

    emitTypingStop();

    if (roomId) {
      socket.emit('message:send', { roomId, text: trimmed });
    } else if (toUserId) {
      socket.emit('dm:send', { toUserId, text: trimmed });
    }

    setText('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const remaining = MAX_CHARS - text.length;
  const nearLimit = text.length > 1800;
  const overLimit = text.length > MAX_CHARS;
  const placeholder = roomId ? 'Message…' : 'Direct message…';

  return (
    <div className="flex-shrink-0 px-4 pb-4 pt-1">
      <div
        className={`flex items-end gap-2 rounded-lg bg-[#383a40] px-3 py-2.5 ${
          overLimit ? 'ring-1 ring-red-500' : ''
        }`}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 resize-none bg-transparent text-sm leading-5 text-[#dcddde] placeholder-[#6d6f78] outline-none"
          style={{ minHeight: '20px', maxHeight: '160px' }}
        />
        {nearLimit && (
          <span
            className={`flex-shrink-0 text-xs tabular-nums ${
              overLimit ? 'text-red-400' : 'text-[#949ba4]'
            }`}
          >
            {remaining}
          </span>
        )}
      </div>
      <p className="mt-1 px-1 text-xs text-[#6d6f78]">
        Enter to send&ensp;·&ensp;Shift+Enter for new line
      </p>
    </div>
  );
}
