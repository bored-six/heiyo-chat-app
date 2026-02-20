import { useState } from 'react';
import { useChat } from '../context/ChatContext.jsx';
import { avatarUrl } from '../utils/avatar.js';
import { statusColor } from '../utils/status.js';
import ProfileCard from './ProfileCard.jsx';
import DisplayCatalogueModal from './DisplayCatalogueModal.jsx';

export default function OnlineUsersPanel({ onClose }) {
  const { onlineUsers, me, socket, dmUnread } = useChat();
  const [profileUser, setProfileUser] = useState(null);
  const [catalogueOpen, setCatalogueOpen] = useState(false);

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
        {/* Self — click to view own profile */}
        <div
          className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-white/5 transition-colors cursor-pointer"
          onClick={() => setProfileUser(me)}
        >
          <div className="relative flex-shrink-0">
            <img
              src={avatarUrl(me.avatar)}
              alt={me.username}
              className="h-8 w-8 rounded-full"
              style={{ border: `2px solid ${me.color}`, boxShadow: `0 0 8px ${me.color}88` }}
            />
            {me.statusEmoji && (
              <span
                className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] leading-none pointer-events-none"
                style={{ background: '#2D1B4E', border: `1.5px solid ${me.color}44` }}
              >
                {me.statusEmoji}
              </span>
            )}
            <span
              className="absolute -top-0.5 -left-0.5 h-3 w-3 rounded-full border-2"
              style={{ background: statusColor(me.presenceStatus ?? 'online'), borderColor: '#2D1B4E' }}
            />
          </div>
          <span className="flex-1 truncate font-heading text-sm font-black text-white">
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
                <button
                  onClick={() => setProfileUser(user)}
                  className="relative flex-shrink-0 hover:scale-110 transition-transform duration-150"
                >
                  <img
                    src={avatarUrl(user.avatar)}
                    alt={user.username}
                    className="h-8 w-8 rounded-full"
                    style={{ border: `2px solid ${user.color}`, boxShadow: `0 0 8px ${user.color}88` }}
                  />
                  {user.statusEmoji && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] leading-none pointer-events-none"
                      style={{ background: '#2D1B4E', border: `1.5px solid ${user.color}44` }}
                    >
                      {user.statusEmoji}
                    </span>
                  )}
                  <span
                    className="absolute -top-0.5 -left-0.5 h-3 w-3 rounded-full border-2"
                    style={{ background: statusColor(user.presenceStatus ?? 'online'), borderColor: '#2D1B4E' }}
                  />
                </button>
                <span
                  className="flex-1 truncate font-heading text-sm font-black text-white cursor-pointer hover:underline decoration-dotted"
                  onClick={() => setProfileUser(user)}
                >
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

        {/* Profile card popup */}
        {profileUser && (
          <ProfileCard
            user={profileUser}
            isSelf={profileUser.id === me?.id}
            onClose={() => setProfileUser(null)}
            onDm={() => { openDm(profileUser.id); }}
            onEditProfile={() => setCatalogueOpen(true)}
          />
        )}

        {/* Display Catalogue modal (opened from own ProfileCard) */}
        {catalogueOpen && (
          <DisplayCatalogueModal onClose={() => setCatalogueOpen(false)} />
        )}
      </div>
    </div>
  );
}
