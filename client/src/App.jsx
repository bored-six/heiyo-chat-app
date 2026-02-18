import { useChat } from './context/ChatContext.jsx';

export default function App() {
  const { connected, me } = useChat();

  if (!connected) return <p>Connecting…</p>;

  return <p>Connected as <strong style={{ color: me.color }}>{me.username}</strong></p>;
}
