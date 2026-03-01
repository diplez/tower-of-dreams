// ═══════════════════════════════════════
// TOWER OF DREAMS — Type Definitions
// ═══════════════════════════════════════

// ── BIOMES ──
export type BiomeType =
  | 'cimientos'
  | 'medieval'
  | 'ciudad'
  | 'cielo'
  | 'estratosfera'
  | 'espacio'
  | 'galaxia'
  | 'multiverso';

export interface BiomeConfig {
  id: BiomeType;
  name: string;
  emoji: string;
  startFloor: number;
  endFloor: number;
  bgGradient: string[];
}

// ── FLOORS ──
export type FloorStatus = 'building' | 'completed';
export type SpecialFloorType = 'golden' | 'diamond' | 'historic' | 'palindrome' | null;

export interface Floor {
  id: number;
  status: FloorStatus;
  progress: number; // 0-100
  owner_id: string | null;
  owner_contribution: number;
  biome: BiomeType;
  is_special: boolean;
  special_type: SpecialFloorType;
  completed_at: string | null;
  created_at: string;
}

export interface FloorWithOwner extends Floor {
  owner?: UserProfile;
  contributions?: Contribution[];
}

// ── CONTRIBUTIONS ──
export interface Contribution {
  id: string;
  floor_id: number;
  user_id: string;
  amount: number;
  created_at: string;
  user?: UserProfile;
}

// ── USERS ──
export type TierLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface TierConfig {
  level: TierLevel;
  name: string;
  emoji: string;
  minFloors: number;
  color: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  tier: TierLevel;
  total_coins_spent: number;
  total_floors_owned: number;
  total_floors_contributed: number;
  streak_current: number;
  streak_last_date: string | null;
  created_at: string;
}

export interface RankedUser extends UserProfile {
  position: number;
}

// ── WALLET ──
export interface Wallet {
  id: string;
  user_id: string;
  balance: number; // in coins (100 coins = $1)
  total_purchased: number;
  updated_at: string;
}

// ── PAYMENTS ──
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface Payment {
  id: string;
  user_id: string;
  stripe_payment_id: string;
  amount_usd: number;
  coins_credited: number;
  status: PaymentStatus;
  created_at: string;
}

export interface CoinPackage {
  id: string;
  coins: number;
  price: number; // USD
  floors: number;
  bonus: number; // percentage (0, 10, 25, 20, 50)
  emoji: string;
  label: string;
  popular?: boolean;
}

// ── TOWER STATE ──
export interface TowerState {
  id: number;
  current_floor: number;
  total_floors_completed: number;
  total_unique_builders: number;
  total_coins_spent: number;
  updated_at: string;
}

// ── ANIMATIONS ──
export type AnimationLevel =
  | 'standard'
  | 'minor'
  | 'medium'
  | 'epic'
  | 'legendary'
  | 'special'
  | 'grand_final';

export type AnimationType = 'lottie' | 'video' | 'programmatic';
export type HapticStrength = 'none' | 'light' | 'medium' | 'heavy';

export interface AnimationConfig {
  id: string;
  level: AnimationLevel;
  biome: BiomeType | 'all';
  type: AnimationType;
  asset?: string;
  duration: number; // ms
  fullscreen: boolean;
  skippable: boolean;
  skipAfter?: number; // ms
  sound?: string;
  haptic: HapticStrength;
  overlay?: {
    color: string;
    opacity: number;
  };
}

export interface AnimationEvent {
  floor_id: number;
  animation_level: AnimationLevel;
  biome: BiomeType;
  timestamp: string;
}

// ── MESSAGES ──
export interface ChatMessage {
  id: string;
  user_id: string;
  channel: string;
  content: string;
  is_moderated: boolean;
  created_at: string;
  user?: UserProfile;
}

// ── BADGES ──
export interface Badge {
  id: string;
  user_id: string;
  badge_type: string;
  badge_name: string;
  earned_at: string;
}

// ── API RESPONSES ──
export interface ContributeResponse {
  success: boolean;
  floor_completed: boolean;
  new_floor_id?: number;
  animation_level: AnimationLevel | null;
  new_balance: number;
  tier_upgraded: boolean;
  new_tier?: TierLevel;
  error?: string;
}

export interface CreatePaymentResponse {
  client_secret: string;
  payment_id: string;
  error?: string;
}
