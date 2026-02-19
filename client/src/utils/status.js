export const STATUS_META = {
  online:    { color: '#23a55a', label: 'Online' },
  away:      { color: '#f0b232', label: 'Away' },
  dnd:       { color: '#f23f43', label: 'Do Not Disturb' },
  invisible: { color: '#80848e', label: 'Invisible' },
  offline:   { color: '#80848e', label: 'Offline' },
};

export function statusColor(s) {
  return STATUS_META[s]?.color ?? '#80848e';
}

export function statusLabel(s) {
  return STATUS_META[s]?.label ?? 'Offline';
}
