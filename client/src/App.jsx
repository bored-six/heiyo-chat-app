import { useEffect, useRef } from 'react';
import { useChat } from './context/ChatContext.jsx';
import BubbleUniverse from './components/BubbleUniverse.jsx';
import RoomPortal from './components/RoomPortal.jsx';
import UserBadge from './components/UserBadge.jsx';
import AuthScreen from './components/AuthScreen.jsx';

export default function App() {
  const { connected, socket, activeRoomId, activeDmId, setAuthUser, authUser } = useChat();
  const everConnected = useRef(false);
  if (connected) everConnected.current = true;

  // Pre-load General's messages on connect but don't navigate there —
  // the user lands in the Bubble Universe and picks their own room.
  useEffect(() => {
    if (!connected || !socket) return;
    socket.emit('room:join', { roomId: 'general' });
  }, [connected, socket]);

  if (!authUser) {
    return <AuthScreen onAuth={setAuthUser} />;
  }

  if (!connected && !everConnected.current) {
    return (
      <div className="relative flex h-screen items-center justify-center overflow-hidden bg-[#0D0D1A]">
        <div className="pointer-events-none absolute inset-0 pattern-dots opacity-[0.07]" />
        <div className="text-center animate-appear">
          <p className="font-heading text-5xl font-black uppercase tracking-tighter text-gradient">
            Entering Heiyo…
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
      {/* ── Reconnecting banner (only after initial connection is established) ── */}
      {!connected && (
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 border-b border-yellow-500/30 bg-yellow-500/10 py-1.5 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
          <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-yellow-300">
            Reconnecting…
          </span>
        </div>
      )}
      {/* ── Global background layers ── */}
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-[0.07]" />
      <div className="pointer-events-none absolute inset-0 pattern-mesh" />

      {/* ── Massive background word ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
      >
        <span className="font-heading text-[20rem] font-black uppercase leading-none text-[#FF3AF2] opacity-[0.035]">
          HEIYO
        </span>
      </div>

      {/* ── Main view ── */}
      {hasActiveConversation ? <RoomPortal /> : <BubbleUniverse />}

      {/* ── Floating user badge — always visible ── */}
      <UserBadge />
    </div>
  );
}
