const MUTED_KEY = 'heiyo_muted_rooms';

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Play a soft two-tone ping using the Web Audio API.
 * Fails silently if autoplay policy blocks it.
 */
export function playPing(volume = 0.12) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    // Drop from C6 → A5 for a gentle "ding"
    osc.frequency.setValueAtTime(1046, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.28);
  } catch {
    // Autoplay blocked or AudioContext unsupported — fail silently
  }
}

export function getMutedRooms() {
  try { return new Set(JSON.parse(localStorage.getItem(MUTED_KEY) ?? '[]')); }
  catch { return new Set(); }
}

export function toggleRoomMute(roomId) {
  const muted = getMutedRooms();
  if (muted.has(roomId)) muted.delete(roomId);
  else muted.add(roomId);
  localStorage.setItem(MUTED_KEY, JSON.stringify([...muted]));
  return muted;
}

export function isRoomMuted(roomId) {
  return getMutedRooms().has(roomId);
}
