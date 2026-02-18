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
      };
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
      return { ...state, activeDmId: action.dmId, activeRoomId: null };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [authUser, setAuthUserRaw] = useState(null);

  const setAuthUser = useCallback((user) => {
    setAuthUserRaw(user);
  }, []);

  const socket = useSocket(dispatch, authUser);

  return (
    <ChatContext.Provider value={{ ...state, dispatch, socket, setAuthUser }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>');
  return ctx;
}
