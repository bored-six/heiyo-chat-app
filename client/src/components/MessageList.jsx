import { useEffect, useRef, useState } from 'react';
import Message from './Message.jsx';

export default function MessageList({ messages, myId }) {
  const containerRef   = useRef(null);
  const bottomRef      = useRef(null);
  const isAtBottomRef  = useRef(true);   // sync ref so effects don't go stale
  const prevLengthRef  = useRef(null);   // null = not yet initialized

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newCount,   setNewCount]   = useState(0);

  // On mount: snap to bottom instantly, init prevLength
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
    isAtBottomRef.current = true;
    prevLengthRef.current = messages.length;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When messages arrive after initial load
  useEffect(() => {
    // First invocation after mount: prevLength already set above, skip
    if (prevLengthRef.current === null) {
      prevLengthRef.current = messages.length;
      return;
    }

    const added = messages.length - prevLengthRef.current;
    prevLengthRef.current = messages.length;
    if (added <= 0) return;

    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setNewCount((c) => c + added);
    }
  }, [messages.length]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
    if (atBottom) setNewCount(0);
  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewCount(0);
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <span className="animate-bounce-subtle text-6xl" aria-hidden="true">
          💬
        </span>
        <p className="font-heading text-base font-black uppercase tracking-[0.25em] text-[#FF3AF2]/50">
          Nothing yet — break the silence
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Scroll container */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-y-auto py-2"
        onScroll={handleScroll}
      >
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} isOwn={msg.senderId === myId} />
        ))}
        {/* Invisible anchor */}
        <div ref={bottomRef} />
      </div>

      {/* ── Floating scroll-to-bottom pill ── */}
      {!isAtBottom && newCount > 0 && (
        <button
          onClick={scrollToBottom}
          className="animate-appear absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border-2 border-[#FF3AF2] bg-[#0D0D1A]/90 px-4 py-1.5 font-heading text-xs font-black uppercase tracking-widest text-[#FF3AF2] backdrop-blur-sm transition-all hover:scale-105"
          style={{ boxShadow: '0 0 14px #FF3AF255, 0 0 28px #FF3AF222' }}
        >
          ↓ {newCount} new
        </button>
      )}
    </div>
  );
}
