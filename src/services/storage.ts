import { PlayerStats, Classmate, GiftHistoryEntry, GiftVoucher, ActiveBooster } from '../types/game';

const STATS_KEY = 'sparklab_player_stats';
const CLASSMATES_KEY = 'sparklab_classmates';
const GIFT_HISTORY_KEY = 'sparklab_gift_history';
const VOUCHERS_KEY = 'sparklab_vouchers';

const DEFAULT_STATS: PlayerStats = {
  coins: 160, // Friendly starting bonus so player can immediately experiment with gifting or workshop
  totalCoinsEarned: 160,
  totalCoinsGifted: 0,
  starsByLevel: { 1: 0 },
  highScores: {},
  unlockedSkins: ['rover_classic'],
  equippedSkin: 'rover_classic',
  unlockedTrails: ['trail_sparkle'],
  equippedTrail: 'trail_sparkle',
  activeBoosters: [],
  claimedGiftCodes: [],
};

const DEFAULT_CLASSMATES: Classmate[] = [
  {
    id: 'mia_robotics',
    name: 'Mia Vance',
    role: 'Robotics & Hardware Prodigy',
    avatarSeed: 'mia',
    favoriteDomain: 'physics',
    wishlist: 'Quantum Gyroscope & Micro-actuators',
    friendshipLevel: 1,
    coinsReceived: 0,
    personalBio: 'Building an autonomous campus rover. Needs precision gears and power cells!',
    recentReply: 'Hey inventor! Thanks for checking in. Can’t wait to test our rover prototypes!',
    giftRewardBooster: {
      name: 'Turbo Gyro Thruster',
      description: 'Increases rover movement speed by 25%!',
      effect: 'speed',
      multiplier: 1.25,
    },
  },
  {
    id: 'leo_astronomy',
    name: 'Leo Tanaka',
    role: 'Astrobiology & Space Club Lead',
    avatarSeed: 'leo',
    favoriteDomain: 'space',
    wishlist: 'Deep-Space Spectrometer Lens',
    friendshipLevel: 1,
    coinsReceived: 0,
    personalBio: 'Mapping constellations and exoplanet atmospheres from the campus observatory.',
    recentReply: 'Clear skies tonight! The stars are aligned for discovery.',
    giftRewardBooster: {
      name: 'Graviton Magnet Core',
      description: 'Draws spark orbs and coins toward your rover from 2x distance!',
      effect: 'magnet',
      multiplier: 2.0,
    },
  },
  {
    id: 'zoe_acoustics',
    name: 'Zoe Chen',
    role: 'Synthesizer & Soundwave Artist',
    avatarSeed: 'zoe',
    favoriteDomain: 'acoustics',
    wishlist: 'Resonant Crystal Chimes & Dials',
    friendshipLevel: 1,
    coinsReceived: 0,
    personalBio: 'Composing harmonic soundscapes and studying the acoustic frequencies of matter.',
    recentReply: 'Music is just mathematics that you can feel with your soul.',
    giftRewardBooster: {
      name: 'Harmonic Coin Resonance',
      description: 'Awards +30% bonus Spark Coins on level completion!',
      effect: 'bonus_coins',
      multiplier: 1.3,
    },
  },
  {
    id: 'marcus_ecology',
    name: 'Marcus Rivera',
    role: 'Eco-Engineer & Botanist',
    avatarSeed: 'marcus',
    favoriteDomain: 'biology',
    wishlist: 'Hydroponic Solar Sensors',
    friendshipLevel: 1,
    coinsReceived: 0,
    personalBio: 'Restoring our school greenhouse biodome with solar-powered micro-irrigation.',
    recentReply: 'Every seed is a tiny invention packed with genetic potential.',
    giftRewardBooster: {
      name: 'Photosynthetic Kinetic Shield',
      description: 'Provides a protective kinetic bubble absorbing one collision!',
      effect: 'shield',
      multiplier: 1.0,
    },
  },
  {
    id: 'elena_lexicon',
    name: 'Elena Rostova',
    role: 'Creative Writer & Linguistics Champ',
    avatarSeed: 'elena',
    favoriteDomain: 'lexicon',
    wishlist: 'Illuminated Holographic Dictionary',
    friendshipLevel: 1,
    coinsReceived: 0,
    personalBio: 'Crafting algorithmic poetry and studying the origins of scientific vocabulary.',
    recentReply: 'Words have the power to bridge any chasm!',
    giftRewardBooster: {
      name: 'Lexicon Star Amplifier',
      description: 'Boosts final level score by 20% for 3-star runs!',
      effect: 'bonus_coins',
      multiplier: 1.2,
    },
  },
];

export const GIFT_ITEMS = [
  { id: 'cogwheel', name: 'Golden Cogwheel of Ingenuity', cost: 30, icon: '⚙️', desc: 'A precision brass cog that boosts mechanical prototypes' },
  { id: 'prism', name: 'Quantum Refraction Prism', cost: 50, icon: '💎', desc: 'Splits sunlight into vibrant coherent wavelengths' },
  { id: 'flask', name: 'Stardust Bioluminescence Vial', cost: 75, icon: '🧪', desc: 'Glows in the dark with sustainable algal energy' },
  { id: 'quill', name: 'Starlight Calligraphy Quill', cost: 100, icon: '🪶', desc: 'Inscribes inspiring formulas with sparkling golden ink' },
  { id: 'trophy', name: 'Polymath Friendship Trophy', cost: 150, icon: '🏆', desc: 'The ultimate symbol of peer collaboration and support' },
];

export const ROVER_SKINS = [
  { id: 'rover_classic', name: 'Quantum White', cost: 0, color: '#38bdf8', secondary: '#0284c7', desc: 'Standard issue prototype rover chassis.' },
  { id: 'rover_emerald', name: 'Bio-Reactor Green', cost: 120, color: '#10b981', secondary: '#047857', desc: 'Reinforced with algal biopolymers.' },
  { id: 'rover_amber', name: 'Solar Flare Gold', cost: 200, color: '#f59e0b', secondary: '#b45309', desc: 'Forged from high-conductivity solar alloys.' },
  { id: 'rover_violet', name: 'Nebula Violet', cost: 280, color: '#a855f7', secondary: '#7e22ce', desc: 'Infused with luminescent stellar dust.' },
  { id: 'rover_obsidian', name: 'Obsidian Stealth', cost: 350, color: '#334155', secondary: '#0f172a', desc: 'Matte composite carbon fiber.' },
];

export const ROVER_TRAILS = [
  { id: 'trail_sparkle', name: 'Sparkle Stardust', cost: 0, color: '#67e8f9', desc: 'Gentle glittering particle sparks.' },
  { id: 'trail_flame', name: 'Plasma Jet', cost: 100, color: '#f97316', desc: 'Blazing ion-drive orange exhaust.' },
  { id: 'trail_rainbow', name: 'Chromatic Spectrum', cost: 180, color: '#ec4899', desc: 'Cycling prismatic rainbow photons.' },
  { id: 'trail_binary', name: 'Cyber Hex Grid', cost: 260, color: '#10b981', desc: 'Cascading digital code packets.' },
];

export class StorageService {
  public static getStats(): PlayerStats {
    try {
      const data = localStorage.getItem(STATS_KEY);
      if (!data) return DEFAULT_STATS;
      return { ...DEFAULT_STATS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_STATS;
    }
  }

  public static saveStats(stats: PlayerStats) {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to save stats', e);
    }
  }

  public static getClassmates(): Classmate[] {
    try {
      const data = localStorage.getItem(CLASSMATES_KEY);
      if (!data) return DEFAULT_CLASSMATES;
      const parsed = JSON.parse(data);
      // Ensure default classmates exist if updated
      const idMap = new Set(parsed.map((c: Classmate) => c.id));
      const merged = [...parsed];
      DEFAULT_CLASSMATES.forEach(c => {
        if (!idMap.has(c.id)) merged.push(c);
      });
      return merged;
    } catch {
      return DEFAULT_CLASSMATES;
    }
  }

  public static saveClassmates(classmates: Classmate[]) {
    try {
      localStorage.setItem(CLASSMATES_KEY, JSON.stringify(classmates));
    } catch (e) {
      console.error('Failed to save classmates', e);
    }
  }

  public static getGiftHistory(): GiftHistoryEntry[] {
    try {
      const data = localStorage.getItem(GIFT_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static addGiftHistoryEntry(entry: GiftHistoryEntry) {
    const history = this.getGiftHistory();
    history.unshift(entry);
    // Keep last 30
    const trimmed = history.slice(0, 30);
    try {
      localStorage.setItem(GIFT_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save gift history', e);
    }
  }

  public static getVouchers(): GiftVoucher[] {
    try {
      const data = localStorage.getItem(VOUCHERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveVoucher(voucher: GiftVoucher) {
    const list = this.getVouchers();
    list.unshift(voucher);
    try {
      localStorage.setItem(VOUCHERS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save voucher', e);
    }
  }

  // Gift coins to a classmate
  public static giftCoins(
    classmateId: string,
    coinAmount: number,
    giftItemId: string,
    customNote: string
  ): { success: boolean; message: string; booster?: ActiveBooster; reply?: string } {
    const stats = this.getStats();
    const item = GIFT_ITEMS.find(i => i.id === giftItemId) || GIFT_ITEMS[0];
    const totalCost = coinAmount + item.cost;

    if (stats.coins < totalCost) {
      return { success: false, message: `Not enough coins! You need ${totalCost} coins (Gift Item: ${item.cost} + Coins: ${coinAmount}).` };
    }

    const classmates = this.getClassmates();
    const classmate = classmates.find(c => c.id === classmateId);
    if (!classmate) {
      return { success: false, message: 'Classmate not found!' };
    }

    // Deduct coins and record stats
    stats.coins -= totalCost;
    stats.totalCoinsGifted = (stats.totalCoinsGifted || 0) + totalCost;

    // Update classmate friendship & coins
    classmate.coinsReceived = (classmate.coinsReceived || 0) + totalCost;
    const oldLevel = classmate.friendshipLevel;
    // Every 100 coins received bumps friendship up to max 5
    classmate.friendshipLevel = Math.min(5, 1 + Math.floor(classmate.coinsReceived / 100));

    // Dynamic personalized thank-you note from classmate
    const responses = [
      `"Oh wow, thank you so much! That ${item.name} is exactly what I needed for my research project!"`,
      `"You're the best study buddy ever! I've attached my favorite booster device to help your rover."`,
      `"This made my day! Here's a custom gadget I calibrated just for you!"`,
      `"Amazing collaboration! Together our inventor guild will build wonders."`
    ];
    const reply = responses[Math.floor(Math.random() * responses.length)];
    classmate.recentReply = reply;

    // Create reward booster from classmate
    let booster: ActiveBooster | undefined;
    if (classmate.giftRewardBooster) {
      booster = {
        id: `boost_${Date.now()}`,
        name: classmate.giftRewardBooster.name,
        description: classmate.giftRewardBooster.description,
        effect: classmate.giftRewardBooster.effect,
        multiplier: classmate.giftRewardBooster.multiplier,
        fromFriend: classmate.name,
      };

      // Add to player active boosters (filter duplicates of same effect)
      stats.activeBoosters = [
        ...stats.activeBoosters.filter(b => b.effect !== booster!.effect),
        booster
      ];
    }

    this.saveStats(stats);
    this.saveClassmates(classmates);

    // Save gift history
    this.addGiftHistoryEntry({
      id: `gift_${Date.now()}`,
      recipientName: classmate.name,
      amount: totalCost,
      giftItemName: item.name,
      customNote: customNote || 'Keep shining and inventing!',
      timestamp: Date.now(),
      reciprocatedBooster: booster?.name,
    });

    const levelUpNotice = classmate.friendshipLevel > oldLevel ? ` Friendship increased to Level ${classmate.friendshipLevel}!` : '';

    return {
      success: true,
      message: `Successfully gifted ${totalCost} coins and ${item.name} to ${classmate.name}!${levelUpNotice}`,
      booster,
      reply,
    };
  }

  // Add custom classmate / study buddy
  public static addCustomClassmate(name: string, role: string, bio: string): Classmate {
    const classmates = this.getClassmates();
    const domains: Array<Classmate['favoriteDomain']> = ['physics', 'optics', 'lexicon', 'biology', 'math', 'space', 'logic', 'acoustics', 'invention'];
    const chosenDomain = domains[Math.floor(Math.random() * domains.length)];

    const newBuddy: Classmate = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      role: role.trim() || 'Fellow Student Inventor',
      avatarSeed: name.toLowerCase().replace(/\s+/g, '_'),
      favoriteDomain: chosenDomain,
      wishlist: 'Creative Workshop Supplies',
      friendshipLevel: 1,
      coinsReceived: 0,
      personalBio: bio.trim() || 'A passionate classmate ready to build creative contraptions.',
      recentReply: 'Thanks for adding me to your study circle! Let’s invent together!',
      giftRewardBooster: {
        name: `${name.split(' ')[0]}'s Synergy Spark`,
        description: 'Increases all level coin earnings by +25%!',
        effect: 'bonus_coins',
        multiplier: 1.25,
      },
    };

    classmates.push(newBuddy);
    this.saveClassmates(classmates);
    return newBuddy;
  }

  // Create shareable voucher code with coins
  public static createGiftVoucher(senderName: string, amount: number, message: string): { success: boolean; code?: string; error?: string } {
    const stats = this.getStats();
    if (stats.coins < amount) {
      return { success: false, error: `You have ${stats.coins} coins, need ${amount} to package this gift code.` };
    }

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `GIFT-SPARK-${randomSuffix}`;

    stats.coins -= amount;
    stats.totalCoinsGifted = (stats.totalCoinsGifted || 0) + amount;
    this.saveStats(stats);

    const voucher: GiftVoucher = {
      code,
      senderName: senderName || 'Classmate',
      coinAmount: amount,
      message: message || 'Enjoy these Spark Coins for your inventions!',
      createdAt: Date.now(),
    };
    this.saveVoucher(voucher);

    return { success: true, code };
  }

  // Redeem a gift code
  public static redeemGiftCode(codeRaw: string): { success: boolean; amount?: number; sender?: string; message?: string; error?: string } {
    const code = codeRaw.trim().toUpperCase();
    const stats = this.getStats();

    if (stats.claimedGiftCodes.includes(code)) {
      return { success: false, error: 'You have already redeemed this gift voucher!' };
    }

    // Check special built-in codes
    if (code === 'WELCOME-SPARK-100') {
      stats.coins += 100;
      stats.totalCoinsEarned += 100;
      stats.claimedGiftCodes.push(code);
      this.saveStats(stats);
      return {
        success: true,
        amount: 100,
        sender: 'Professor Ada Lovelace',
        message: 'Welcome to the SparkLab Academy! Use these coins wisely on your creative journey.'
      };
    }

    if (code === 'STUDY-BUDDY-50') {
      stats.coins += 50;
      stats.totalCoinsEarned += 50;
      stats.claimedGiftCodes.push(code);
      this.saveStats(stats);
      return {
        success: true,
        amount: 50,
        sender: 'Student Innovation Council',
        message: 'A bonus gift for collaborative peer learning!'
      };
    }

    // Check custom saved vouchers
    const vouchers = this.getVouchers();
    const found = vouchers.find(v => v.code === code);
    if (!found) {
      return { success: false, error: 'Invalid or expired gift code. Check the spelling or ask your classmate!' };
    }

    stats.coins += found.coinAmount;
    stats.totalCoinsEarned += found.coinAmount;
    stats.claimedGiftCodes.push(code);
    this.saveStats(stats);

    return {
      success: true,
      amount: found.coinAmount,
      sender: found.senderName,
      message: found.message,
    };
  }

  // Record Level Completion
  public static completeLevel(levelId: number, score: number, timeSpentSec: number, parTime: number, baseReward: number): {
    stars: number;
    coinsEarned: number;
    isNewHighScore: boolean;
  } {
    const stats = this.getStats();
    let stars = 1;
    if (timeSpentSec <= parTime && score >= 200) stars = 2;
    if (timeSpentSec <= parTime * 0.8 && score >= 350) stars = 3;

    // Apply active booster multipliers
    let coinMultiplier = 1.0;
    stats.activeBoosters.forEach(b => {
      if (b.effect === 'bonus_coins') {
        coinMultiplier *= b.multiplier;
      }
    });

    const starBonus = stars * 25;
    const coinsEarned = Math.round((baseReward + starBonus) * coinMultiplier);

    stats.coins += coinsEarned;
    stats.totalCoinsEarned += coinsEarned;

    const oldStars = stats.starsByLevel[levelId] || 0;
    if (stars > oldStars) {
      stats.starsByLevel[levelId] = stars;
    }

    const oldHigh = stats.highScores[levelId] || 0;
    const isNewHighScore = score > oldHigh;
    if (isNewHighScore) {
      stats.highScores[levelId] = score;
    }

    this.saveStats(stats);
    return { stars, coinsEarned, isNewHighScore };
  }
}
