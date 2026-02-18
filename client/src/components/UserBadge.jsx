import { useChat } from '../context/ChatContext.jsx';

export default function UserBadge() {
  const { me, onlineUsers } = useChat();
  if (!me) return null;

  const initial = me.username?.[0]?.toUpperCase() ?? '?';
  // onlineUsers tracks others; +1 counts ourselves
  const count = Object.keys(onlineUsers).length + 1;

  return (
    <div
      className="absolute bottom-6 left-6 z-30 flex items-center gap-3 rounded-full border-4 border-dashed border-[#FFE600] bg-[#2D1B4E]/90 px-4 py-2 backdrop-blur-sm animate-slide-up"
      style={{ boxShadow: '0 0 20px rgba(255,230,0,0.4), 4px 4px 0 #FF3AF2' }}
    >
      {/* Colored avatar */}
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-heading text-sm font-black text-white"
        style={{
          backgroundColor: me.color,
          boxShadow: `0 0 14px ${me.color}bb`,
          border: '2px solid #FFE600',
        }}
      >
        {initial}
      </div>

      {/* Name + count */}
      <div>
        <p
          className="font-heading text-sm font-black uppercase leading-none tracking-tight text-white"
          style={{ textShadow: `1px 1px 0 ${me.color}` }}
        >
          {me.username}
        </p>
        <p className="mt-0.5 font-heading text-[10px] font-black uppercase tracking-widest text-[#00F5D4]">
          {count} online
        </p>
      </div>

      {/* Live pulse dot */}
      <span
        aria-label="Online"
        className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#00F5D4] animate-pulse"
      />
    </div>
  );
}
