import { useChat } from '../context/ChatContext.jsx';

export default function Sidebar() {
  const { me, rooms, dms, activeRoomId, activeDmId, onlineUsers, dispatch, socket } = useChat();

  function handleRoomClick(roomId) {
    socket.emit('room:join', { roomId });
    dispatch({ type: 'SET_ACTIVE_ROOM', roomId });
  }

  function handleDmClick(dmId) {
    dispatch({ type: 'SET_ACTIVE_DM', dmId });
  }

  // Resolve the "other" participant of a DM to a display object
  function otherParticipant(dm) {
    const otherId = dm.participants.find((id) => id !== me.id);
    return onlineUsers[otherId] ?? { id: otherId, username: 'Unknown', color: '#6b7280' };
  }

  const dmList = Object.values(dms);

  return (
    <aside className="flex w-60 flex-shrink-0 flex-col overflow-hidden bg-[#2b2d31]">
      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto p-2 pt-3">
        {/* ── Rooms ── */}
        <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-[#949ba4]">
          Rooms
        </p>

        {rooms.map((room) => {
          const active = room.id === activeRoomId;
          return (
            <button
              key={room.id}
              onClick={() => handleRoomClick(room.id)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors ${
                active
                  ? 'bg-[#404249] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dcddde]'
              }`}
            >
              <span className="text-[#6d6f78]">#</span>
              <span className="truncate">{room.name}</span>
            </button>
          );
        })}

        {/* ── Direct Messages ── */}
        {dmList.length > 0 && (
          <>
            <p className="mt-4 px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-[#949ba4]">
              Direct Messages
            </p>

            {dmList.map((dm) => {
              const other = otherParticipant(dm);
              const active = dm.id === activeDmId;
              return (
                <button
                  key={dm.id}
                  onClick={() => handleDmClick(dm.id)}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors ${
                    active
                      ? 'bg-[#404249] text-white'
                      : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dcddde]'
                  }`}
                >
                  <Avatar username={other.username} color={other.color} size={6} />
                  <span className="truncate">{other.username}</span>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* ── User badge (bottom) ── */}
      <div className="flex items-center gap-2.5 border-t border-[#1e1f22] bg-[#232428] px-3 py-2.5">
        <Avatar username={me?.username ?? '?'} color={me?.color ?? '#6b7280'} size={8} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#dcddde]">{me?.username}</p>
          <p className="text-xs text-[#23a55a]">Online</p>
        </div>
      </div>
    </aside>
  );
}

// Shared colored-circle avatar used in both sections
function Avatar({ username, color, size }) {
  const sizeClass = size === 6 ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm';
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white ${sizeClass}`}
      style={{ backgroundColor: color }}
    >
      {username[0]?.toUpperCase() ?? '?'}
    </div>
  );
}
