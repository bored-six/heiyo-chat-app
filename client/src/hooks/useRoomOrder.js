import { useState, useCallback } from 'react';

const PIN_KEY = 'heiyo_pinned_room';

/**
 * Manages room ordering + pinning.
 *
 * - `sortedRooms` — rooms auto-sorted by last activity (most recent message first).
 *                   Rooms with no messages sort below active rooms, oldest first.
 *                   Pinned room is always forced to position 0.
 * - `pinnedId`    — roomId of the currently pinned room (or null).
 * - `togglePin`   — pin/unpin a room (only one pinned at a time).
 */
export function useRoomOrder(rooms) {
  const [pinnedId, setPinnedIdRaw] = useState(() => {
    return localStorage.getItem(PIN_KEY) ?? null;
  });

  const setPinnedId = useCallback((id) => {
    setPinnedIdRaw(id);
    if (id) localStorage.setItem(PIN_KEY, id);
    else     localStorage.removeItem(PIN_KEY);
  }, []);

  // Auto-sort by last activity:
  //   1. Rooms with messages → most recent lastMessageAt first
  //   2. Rooms with no messages → oldest createdAt first (new empty rooms stay at bottom)
  const sorted = [...rooms].sort((a, b) => {
    const aHas = a.lastMessageAt != null;
    const bHas = b.lastMessageAt != null;
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    if (aHas && bHas)  return b.lastMessageAt - a.lastMessageAt;
    return (a.createdAt ?? 0) - (b.createdAt ?? 0);
  });

  // Pinned room always comes first regardless of activity
  const sortedRooms = (() => {
    if (!pinnedId) return sorted;
    const pinned = sorted.find(r => r.id === pinnedId);
    const rest   = sorted.filter(r => r.id !== pinnedId);
    return pinned ? [pinned, ...rest] : sorted;
  })();

  function togglePin(roomId) {
    setPinnedId(pinnedId === roomId ? null : roomId);
  }

  return { sortedRooms, pinnedId, togglePin };
}
