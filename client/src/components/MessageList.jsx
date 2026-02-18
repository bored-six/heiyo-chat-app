import { useEffect, useRef } from 'react';
import Message from './Message.jsx';

export default function MessageList({ messages }) {
  const bottomRef = useRef(null);

  // Scroll to bottom whenever the message count changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[#6d6f78]">
        No messages yet — say hello!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}
      {/* Invisible anchor kept at the bottom for auto-scroll */}
      <div ref={bottomRef} />
    </div>
  );
}
