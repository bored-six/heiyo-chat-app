import { useState, useCallback, useRef, useEffect } from 'react';

const ORDER_KEY = 'heiyo_room_order';
const PIN_KEY   = 'heiyo_pinned_room';

/**
 * Manages per-user room ordering + pinning via localStorage.
 *
 * - `sortedRooms` — rooms in the user's preferred order, pinned room always first.
 * - `pinnedId`    — roomId of the currently pinned room (or null).
 * - `togglePin`   — pin/unpin a room (only one pinned at a time).
 * - `reorder`     — move a room from one index to another in the list.
 */
export function useRoomOrder(rooms) {
  const [order, setOrderRaw] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ORDER_KEY) ?? '[]'); }
    catch { return []; }
  });

  const [pinnedId, setPinnedIdRaw] = useState(() => {
    return localStorage.getItem(PIN_KEY) ?? null;
  });

  // Keep refs so effects always see the latest values without re-running
  const orderRef = useRef(order);
  orderRef.current = order;

  const setOrder = useCallback((ids) => {
    const arr = Array.isArray(ids) ? ids : ids(orderRef.current);
    setOrderRaw(arr);
    orderRef.current = arr;
    localStorage.setItem(ORDER_KEY, JSON.stringify(arr));
  }, []);

  const setPinnedId = useCallback((id) => {
    setPinnedIdRaw(id);
    if (id) localStorage.setItem(PIN_KEY, id);
    else     localStorage.removeItem(PIN_KEY);
  }, []);

  // Append any rooms the server added that aren't in the saved order yet
  useEffect(() => {
    const newIds = rooms.map(r => r.id).filter(id => !orderRef.current.includes(id));
    if (newIds.length > 0) {
      setOrder([...orderRef.current, ...newIds]);
    }
  }, [rooms.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build the display order:
  //   1. Everything sorted by user preference
  //   2. Pinned room pulled to front regardless of its position in order
  const sortedRooms = (() => {
    const byId = Object.fromEntries(rooms.map(r => [r.id, r]));
    const inOrder   = order.filter(id => byId[id]).map(id => byId[id]);
    const notInOrder = rooms.filter(r => !order.includes(r.id));
    const all = [...inOrder, ...notInOrder];

    if (!pinnedId) return all;
    const pinned = all.find(r => r.id === pinnedId);
    const rest   = all.filter(r => r.id !== pinnedId);
    return pinned ? [pinned, ...rest] : all;
  })();

  function togglePin(roomId) {
    setPinnedId(pinnedId === roomId ? null : roomId);
  }

  function reorder(fromIdx, toIdx) {
    if (fromIdx === toIdx) return;
    const ids = sortedRooms.map(r => r.id);
    const [moved] = ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, moved);
    setOrder(ids);
  }

  return { sortedRooms, pinnedId, togglePin, reorder };
}
