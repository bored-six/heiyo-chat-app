import { useChat } from '../context/ChatContext.jsx';
import { avatarUrl } from '../utils/avatar.js';

export default function OnlineUsersPanel({ onClose }) {
  const { onlineUsers, me, socket, dmUnread } = useChat();

  const users = Object.values(onlineUsers).filter((u) => u.id !== me?.id);

  function openDm(userId) {
    socket.emit('dm:open', { toUserId: userId });
    onClose();
  }

  return (
    <div
      className="absolute bottom-full left-0 mb-3 w-64 rounded-2xl border-4 border-dashed border-[#00F5D4] bg-[#2D1B4E]/95 backdrop-blur-sm animate-appear"
      style={{ boxShadow: '0 0 24px rgba(0,245,212,0.3)' }}
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
          <img
            src={avatarUrl(me.avatar)}
            alt={me.username}
            className="h-8 w-8 flex-shrink-0 rounded-full"
            style={{ border: `2px solid ${me.color}`, boxShadow: `0 0 8px ${me.color}88` }}
          />
          <span className="flex-1 truncate font-heading text-sm font-black uppercase text-white">
            {me.username}
            {me.tag && (
              <span className="font-heading text-[9px] font-bold normal-case tracking-normal text-white/35 ml-0.5">
                #{me.tag}
              </span>
            )}
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
          users.map((user) => {
            const dmId = [me.id, user.id].sort().join('--');
            const unread = dmUnread?.[dmId] ?? 0;
            return (
              <div
                key={user.id}
                className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-white/5 transition-colors"
              >
                <img
                  src={avatarUrl(user.avatar)}
                  alt={user.username}
                  className="h-8 w-8 flex-shrink-0 rounded-full"
                  style={{ border: `2px solid ${user.color}`, boxShadow: `0 0 8px ${user.color}88` }}
                />
                <span className="flex-1 truncate font-heading text-sm font-black uppercase text-white">
                  {user.username}
                  {user.tag && (
                    <span className="font-heading text-[9px] font-bold normal-case tracking-normal text-white/35 ml-0.5">
                      #{user.tag}
                    </span>
                  )}
                </span>
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => openDm(user.id)}
                    className="rounded-full border-2 border-dashed border-[#FF3AF2] bg-[#FF3AF2]/20 px-2.5 py-0.5 font-heading text-[10px] font-black uppercase tracking-wider text-[#FF3AF2] transition-colors hover:bg-[#FF3AF2]/40"
                  >
                    DM
                  </button>
                  {unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FFE600] px-1 font-heading text-[9px] font-black text-[#0D0D1A]">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
