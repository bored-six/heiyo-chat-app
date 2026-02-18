import { createContext, useContext, useReducer, useState, useCallback } from 'react';
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
      };

    case 'DISCONNECTED':
      return { ...state, connected: false };

    case 'USER_ONLINE':
      return {
        ...state,
        onlineUsers: { ...state.onlineUsers, [action.user.id]: action.user },
      };

    case 'USER_OFFLINE': {
      const { [action.userId]: _removed, ...rest } = state.onlineUsers;
      return { ...state, onlineUsers: rest };
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

    case 'ROOM_CREATED':
      return { ...state, rooms: [...state.rooms, action.room] };

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

  const socket = useSocket(dispatch, authUser);

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
