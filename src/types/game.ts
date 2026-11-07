export type GameState = 
  | 'TITLE_SCREEN'
  | 'LEVEL_SELECT'
  | 'PLAYING'
  | 'PAUSED'
  | 'VICTORY'
  | 'GAME_OVER'
  | 'GIFT_HUB'
  | 'WORKSHOP';

export type SubjectDomain = 
  | 'physics' 
  | 'optics' 
  | 'lexicon' 
  | 'biology' 
  | 'math' 
  | 'space' 
  | 'logic' 
  | 'acoustics' 
  | 'invention';

export interface LevelConfig {
  id: number;
  title: string;
  subtitle: string;
  domain: SubjectDomain;
  domainLabel: string;
  accentColor: string;
  description: string;
  learningGoal: string;
  creativeConcept: string;
  educationalTakeaway: string;
  parTimeSeconds: number;
  rewardCoins: number;
  requiredStarsToUnlock: number;
  // Specific interactive level goals
  puzzleType: 'physics_launch' | 'optics_laser' | 'word_alchemy' | 'ecosystem_balance' | 'prime_locks' | 'gravity_orbit' | 'logic_gates' | 'sound_resonance' | 'contraption_chain';
  targetScore: number;
  wordsToFind?: string[];
  gateGoals?: { [key: string]: boolean };
  frequencyTarget?: number;
}

export interface PlayerStats {
  coins: number;
  totalCoinsEarned: number;
  totalCoinsGifted: number;
  starsByLevel: Record<number, number>; // levelId -> stars (1-3)
  highScores: Record<number, number>;
  unlockedSkins: string[];
  equippedSkin: string;
  unlockedTrails: string[];
  equippedTrail: string;
  activeBoosters: ActiveBooster[];
  claimedGiftCodes: string[];
}

export interface ActiveBooster {
  id: string;
  name: string;
  description: string;
  effect: 'speed' | 'magnet' | 'bonus_coins' | 'shield';
  multiplier: number;
  expiresAtLevel?: number;
  fromFriend: string;
}

export interface Classmate {
  id: string;
  name: string;
  role: string;
  avatarSeed: string;
  favoriteDomain: SubjectDomain;
  wishlist: string;
  friendshipLevel: number; // 1 to 5
  coinsReceived: number;
  personalBio: string;
  recentReply?: string;
  giftRewardBooster?: {
    name: string;
    description: string;
    effect: 'speed' | 'magnet' | 'bonus_coins' | 'shield';
    multiplier: number;
  };
}

export interface GiftHistoryEntry {
  id: string;
  recipientName: string;
  amount: number;
  giftItemName: string;
  customNote: string;
  timestamp: number;
  reciprocatedBooster?: string;
}

export interface GiftVoucher {
  code: string;
  senderName: string;
  coinAmount: number;
  message: string;
  createdAt: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'square' | 'spark' | 'star';
  spin?: number;
  angle?: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
}

export interface LaserMirror {
  id: string;
  x: number;
  y: number;
  angle: number; // in radians
  type: 'reflect' | 'split' | 'prism';
  interactive: boolean;
}

export interface LaserTarget {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  activated: boolean;
  requiredColor?: string;
}

export interface OrbCollectible {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: 'coin' | 'star' | 'letter' | 'energy' | 'prime';
  value: number | string;
  collected: boolean;
  pulseOffset: number;
}

export interface PhysicsObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wall' | 'bounce_pad' | 'portal' | 'hazard' | 'gate' | 'switch';
  color: string;
  activated?: boolean;
  label?: string;
}
