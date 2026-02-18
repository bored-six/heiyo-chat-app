import { useEffect, useRef } from 'react';
import Message from './Message.jsx';

export default function MessageList({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

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
    <div className="flex-1 overflow-y-auto py-2">
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}
      {/* Invisible scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
