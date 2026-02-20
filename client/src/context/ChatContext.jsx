import { createContext, useContext, useReducer, useRef, useState, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket.js';

// ─── State shape ─────────────────────────────────────────────────────────────
//
//  connected     bool
//  me            { id, username, color, connectedAt } | null
//  rooms         [{ id, name, type, memberCount, createdAt }]
//  activeRoomId  string | null
//  roomMessages  { [roomId]: message[] }
//  roomMembers   { [roomId]: user[] }
//  dms           { [dmId]: { id, participants, messages: message[] } }
//  activeDmId    string | null
//  onlineUsers   { [userId]: user }
//  typing        { [roomId]: socketId[] }

const initialState = {
  connected: false,
  me: null,
  rooms: [],
  activeRoomId: null,
  roomMessages: {},
  roomMembers: {},
  dms: {},
  activeDmId: null,
  onlineUsers: {},
  typing: {},
  unread: {},
  dmUnread: {},
  echoes: [],
  removingRooms: [],    // roomIds currently playing the removal animation
  follows: {},          // username → { username, color, avatar, tag, online, id }
  roomEntryOrigin: null, // { x, y } viewport coords of the bubble that was clicked
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'CONNECTED':
      return {
        ...state,
        connected: true,
        me: action.user,
        rooms: action.rooms,
        echoes: action.echoes ?? [],
        onlineUsers: {},
      };

    case 'ECHO_NEW': {
      // Avoid duplicates (e.g. own echo after reconnect)
      const already = state.echoes.some(e => e.id === action.echo.id);
      if (already) return state;
      return { ...state, echoes: [...state.echoes, action.echo] };
    }

    case 'ECHO_EXPIRE':
      return { ...state, echoes: state.echoes.filter(e => e.id !== action.echoId) };

    case 'DISCONNECTED':
      return { ...state, connected: false };

    case 'USER_ONLINE': {
      // Never add self — me is tracked separately and shown in its own row
      if (action.user.id === state.me?.id) return state;
      // If this user is followed, mark them online + update their live socket id
      const followsAfterOnline = { ...state.follows };
      if (action.user.username && followsAfterOnline[action.user.username]) {
        followsAfterOnline[action.user.username] = {
          ...followsAfterOnline[action.user.username],
          ...action.user,
          online: true,
        };
      }
      return {
        ...state,
        onlineUsers: { ...state.onlineUsers, [action.user.id]: action.user },
        follows: followsAfterOnline,
      };
    }

    case 'USER_OFFLINE': {
      const { [action.userId]: removedUser, ...restOnline } = state.onlineUsers;
      // If this user is followed, mark offline but keep them in follows (Option B)
      const followsAfterOffline = { ...state.follows };
      if (removedUser?.username && followsAfterOffline[removedUser.username]) {
        followsAfterOffline[removedUser.username] = {
          ...followsAfterOffline[removedUser.username],
          online: false,
          id: null,
        };
      }
      return { ...state, onlineUsers: restOnline, follows: followsAfterOffline };
    }

    case 'USER_UPDATED': {
      const u = action.user;
      return {
        ...state,
        me: state.me?.id === u.id ? { ...state.me, ...u } : state.me,
        onlineUsers: state.onlineUsers[u.id]
          ? { ...state.onlineUsers, [u.id]: { ...state.onlineUsers[u.id], ...u } }
          : state.onlineUsers,
      };
    }

    case 'SET_ROOMS':
      return { ...state, rooms: action.rooms };

    case 'ROOM_CREATED': {
      const exists = state.rooms.some((r) => r.id === action.room.id);
      if (exists) return state;
      return { ...state, rooms: [...state.rooms, action.room] };
    }

    case 'ROOM_JOINED': {
      const exists = state.rooms.some((r) => r.id === action.room.id);
      return {
        ...state,
        rooms: exists
          ? state.rooms.map((r) => (r.id === action.room.id ? action.room : r))
          : [...state.rooms, action.room],
        roomMessages: { ...state.roomMessages, [action.room.id]: action.messages },
        roomMembers: { ...state.roomMembers, [action.room.id]: action.members },
      };
    }

    case 'ROOM_MEMBERS':
      return {
        ...state,
        roomMembers: { ...state.roomMembers, [action.roomId]: action.members },
      };

    case 'ROOM_LEFT':
      return {
        ...state,
        activeRoomId:
          state.activeRoomId === action.roomId ? null : state.activeRoomId,
      };

    case 'MESSAGE_RECEIVED': {
      const isActive = state.activeRoomId === action.roomId;
      return {
        ...state,
        roomMessages: {
          ...state.roomMessages,
          [action.roomId]: [
            ...(state.roomMessages[action.roomId] ?? []),
            action.message,
          ].slice(-100),
        },
        unread: isActive
          ? state.unread
          : { ...state.unread, [action.roomId]: (state.unread[action.roomId] ?? 0) + 1 },
      };
    }

    case 'DM_OPENED':
      return {
        ...state,
        dms: {
          ...state.dms,
          [action.dm.id]: {
            ...action.dm,
            messages: action.dm.messages ?? [],
          },
        },
      };

    case 'DM_RECEIVED': {
      const existing = state.dms[action.dmId];
      const isActiveDm = state.activeDmId === action.dmId;
      return {
        ...state,
        dms: {
          ...state.dms,
          [action.dmId]: {
            id: action.dmId,
            participants: action.participants,
            messages: existing
              ? [...existing.messages, action.message].slice(-100)
              : [action.message],
          },
        },
        dmUnread: isActiveDm
          ? state.dmUnread
          : { ...state.dmUnread, [action.dmId]: (state.dmUnread[action.dmId] ?? 0) + 1 },
      };
    }

    case 'REACTION_UPDATE': {
      if (action.roomId) {
        const msgs = state.roomMessages[action.roomId] ?? [];
        return {
          ...state,
          roomMessages: {
            ...state.roomMessages,
            [action.roomId]: msgs.map((m) =>
              m.id === action.messageId ? { ...m, reactions: action.reactions } : m
            ),
          },
        };
      }
      if (action.dmId) {
        const dm = state.dms[action.dmId];
        if (!dm) return state;
        return {
          ...state,
          dms: {
            ...state.dms,
            [action.dmId]: {
              ...dm,
              messages: dm.messages.map((m) =>
                m.id === action.messageId ? { ...m, reactions: action.reactions } : m
              ),
            },
          },
        };
      }
      return state;
    }

    case 'ROOM_UPDATED':
      return {
        ...state,
        rooms: state.rooms.map((r) => r.id === action.room.id ? action.room : r),
      };

    // Room fired the expiry animation — keep in rooms list until animation finishes
    case 'ROOM_REMOVING':
      return {
        ...state,
        removingRooms: state.removingRooms.includes(action.roomId)
          ? state.removingRooms
          : [...state.removingRooms, action.roomId],
      };

    // Animation done — actually remove from state
    case 'ROOM_REMOVED':
      return {
        ...state,
        rooms: state.rooms.filter((r) => r.id !== action.roomId),
        removingRooms: state.removingRooms.filter((id) => id !== action.roomId),
        activeRoomId: state.activeRoomId === action.roomId ? null : state.activeRoomId,
      };

    case 'MESSAGE_SEEN': {
      const msgs = state.roomMessages[action.roomId] ?? [];
      return {
        ...state,
        roomMessages: {
          ...state.roomMessages,
          [action.roomId]: msgs.map((m) =>
            m.id === action.messageId ? { ...m, seenBy: action.seenBy } : m
          ),
        },
      };
    }

    case 'FOLLOWS_SET':
      return {
        ...state,
        follows: Object.fromEntries(action.following.map(u => [u.username, u])),
      };

    case 'FOLLOW_ADD':
      return {
        ...state,
        follows: { ...state.follows, [action.user.username]: { ...action.user, online: true } },
      };

    case 'FOLLOW_REMOVE': {
      const { [action.username]: _, ...remainingFollows } = state.follows;
      return { ...state, follows: remainingFollows };
    }

    case 'TYPING_UPDATE':
      return {
        ...state,
        typing: { ...state.typing, [action.roomId]: action.typers },
      };

    case 'SET_ACTIVE_ROOM':
      return {
        ...state,
        activeRoomId: action.roomId,
        activeDmId: null,
        unread: { ...state.unread, [action.roomId]: 0 },
        roomEntryOrigin: action.origin ?? null,
      };

    case 'SET_ACTIVE_DM':
      return {
        ...state,
        activeDmId: action.dmId,
        activeRoomId: null,
        dmUnread: { ...state.dmUnread, [action.dmId]: 0 },
      };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // stateRef gives useSocket access to current state without stale closures
  const stateRef = useRef(state);
  stateRef.current = state;

  // Initialise from localStorage so returning users skip the auth screen immediately
  const [authUser, setAuthUserRaw] = useState(() => {
    try {
      const saved = localStorage.getItem('heiyo_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setAuthUser = useCallback((updaterOrUser) => {
    setAuthUserRaw((prev) => {
      const next = typeof updaterOrUser === 'function' ? updaterOrUser(prev) : updaterOrUser;
      if (next) {
        localStorage.setItem('heiyo_session', JSON.stringify(next));
      } else {
        localStorage.removeItem('heiyo_session');
      }
      return next;
    });
  }, []);

  const socket = useSocket(dispatch, authUser, stateRef, setAuthUser);

  return (
    <ChatContext.Provider value={{ ...state, dispatch, socket, setAuthUser, authUser }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>');
  return ctx;
}
