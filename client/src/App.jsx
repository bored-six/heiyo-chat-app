import { useEffect } from 'react';
import { useChat } from './context/ChatContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import ChatArea from './components/ChatArea.jsx';

export default function App() {
  const { connected, socket, dispatch } = useChat();

  // Auto-join General and set it active as soon as we connect
  useEffect(() => {
    if (!connected || !socket) return;
    socket.emit('room:join', { roomId: 'general' });
    dispatch({ type: 'SET_ACTIVE_ROOM', roomId: 'general' });
  }, [connected, socket, dispatch]);

  if (!connected) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#313338] text-[#949ba4]">
        <p className="text-lg">Connecting…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#313338] text-[#dcddde]">
      <Sidebar />
      <ChatArea />
    </div>
  );
}
