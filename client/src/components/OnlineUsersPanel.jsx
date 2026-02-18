import { useChat } from '../context/ChatContext.jsx';

export default function OnlineUsersPanel({ onClose }) {
  const { onlineUsers, me, socket } = useChat();

  const users = Object.values(onlineUsers);

  function openDm(userId) {
    socket.emit('dm:open', { toUserId: userId });
    onClose();
  }

  return (
    <div
      className="absolute bottom-full left-0 mb-3 w-64 rounded-2xl border-4 border-dashed border-[#00F5D4] bg-[#2D1B4E]/95 backdrop-blur-sm animate-appear"
      style={{ boxShadow: '0 0 24px rgba(0,245,212,0.3), 6px 6px 0 #FF3AF2' }}
    >
      {/* Header */}
      <div className="border-b-2 border-dashed border-[#00F5D4]/40 px-4 py-3">
        <p className="font-heading text-xs font-black uppercase tracking-widest text-[#00F5D4]">
          {users.length + 1} online
        </p>
      </div>

      {/* User list */}
      <div className="max-h-60 overflow-y-auto p-2 space-y-0.5">
        {/* Self — no DM button */}
        <div className="flex items-center gap-2 rounded-xl px-2 py-2">
          <div
            className="h-7 w-7 flex-shrink-0 rounded-full flex items-center justify-center font-heading text-xs font-black text-white"
            style={{ backgroundColor: me.color, boxShadow: `0 0 8px ${me.color}88` }}
          >
            {me.username[0].toUpperCase()}
          </div>
          <span className="flex-1 truncate font-heading text-sm font-black uppercase text-white">
            {me.username}
          </span>
          <span className="font-heading text-[9px] font-black uppercase tracking-wider text-[#FFE600]">
            you
          </span>
        </div>

        {/* Others */}
        {users.length === 0 ? (
          <p className="px-2 py-4 text-center font-heading text-xs text-white/40">
            Nobody else here yet
          </p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-white/5 transition-colors"
            >
              <div
                className="h-7 w-7 flex-shrink-0 rounded-full flex items-center justify-center font-heading text-xs font-black text-white"
                style={{ backgroundColor: user.color, boxShadow: `0 0 8px ${user.color}88` }}
              >
                {user.username[0].toUpperCase()}
              </div>
              <span className="flex-1 truncate font-heading text-sm font-black uppercase text-white">
                {user.username}
              </span>
              <button
                onClick={() => openDm(user.id)}
                className="flex-shrink-0 rounded-full border-2 border-dashed border-[#FF3AF2] bg-[#FF3AF2]/20 px-2.5 py-0.5 font-heading text-[10px] font-black uppercase tracking-wider text-[#FF3AF2] transition-colors hover:bg-[#FF3AF2]/40"
              >
                DM
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
