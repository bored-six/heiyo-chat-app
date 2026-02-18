import { useEffect } from 'react';
import { useChat } from './context/ChatContext.jsx';
import BubbleUniverse from './components/BubbleUniverse.jsx';
import RoomPortal from './components/RoomPortal.jsx';
import UserBadge from './components/UserBadge.jsx';

export default function App() {
  const { connected, socket, activeRoomId, activeDmId } = useChat();

  // Pre-load General's messages on connect but don't navigate there —
  // the user lands in the Bubble Universe and picks their own room.
  useEffect(() => {
    if (!connected || !socket) return;
    socket.emit('room:join', { roomId: 'general' });
  }, [connected, socket]);

  if (!connected) {
    return (
      <div className="relative flex h-screen items-center justify-center overflow-hidden bg-[#0D0D1A]">
        <div className="pointer-events-none absolute inset-0 pattern-dots opacity-[0.08]" />
        <div className="pointer-events-none absolute inset-0 pattern-stripes" />
        <div className="text-center animate-appear">
          <p className="font-heading text-5xl font-black uppercase tracking-tighter text-gradient">
            Entering the Void…
          </p>
          <div className="mt-6 flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-3 w-3 rounded-full bg-[#FF3AF2] animate-bounce"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasActiveConversation = activeRoomId || activeDmId;

  return (
    <div className="relative h-screen overflow-hidden bg-[#0D0D1A]">
      {/* ── Global background layers ── */}
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-[0.07]" />
      <div className="pointer-events-none absolute inset-0 pattern-stripes" />
      <div className="pointer-events-none absolute inset-0 pattern-mesh" />

      {/* ── Massive background word ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
      >
        <span className="font-heading text-[20rem] font-black uppercase leading-none text-[#FF3AF2] opacity-[0.035]">
          VOID
        </span>
      </div>

      {/* ── Main view ── */}
      {hasActiveConversation ? <RoomPortal /> : <BubbleUniverse />}

      {/* ── Floating user badge — always visible ── */}
      <UserBadge />
    </div>
  );
}
