// Shared avatar helpers used by AuthScreen, UserBadge, OnlineUsersPanel, Message

export const AVATAR_SEEDS = [
  'Blazeheart', 'Moonpetal',  'Crystalveil', 'Shadowpeak',
  'Goldenwing', 'Frostbyte',  'Cosmicray',   'Thunderpaw',
  'Stargazer',  'Pinkmochi',  'Neonrush',    'Mistwalker',
  'Voidwalker', 'Sunbeam',    'Crimsonpaw',  'Cyberwave',
  'Prismatic',  'Darknight',
];

// Pastel versions of the Bubble Universe palette used as DiceBear backgrounds
const BG_COLORS = 'ffd6fc,c5fff5,ffe980,d4b8ff,ffc9a8,b8e8ff';

/**
 * Returns a DiceBear adventurer SVG URL for the given seed.
 * Works with any string seed — same seed always yields same chibi.
 */
export function avatarUrl(seed) {
  const s = encodeURIComponent(seed ?? 'default');
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${s}&backgroundColor=${BG_COLORS}&backgroundType=solid&radius=50`;
}
