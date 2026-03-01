// ═══════════════════════════════════════
// TOWER OF DREAMS — Game Constants
// ═══════════════════════════════════════

import { BiomeConfig, TierConfig, CoinPackage } from '@/types';

// ── TOWER ──
export const TOWER_MAX_FLOORS = 1_000_000;
export const FLOOR_COST_COINS = 100; // 100 coins = $1
export const MIN_CONTRIBUTION = 50;
export const MAX_CONTRIBUTION = 100;
export const MAX_CONTRIBUTIONS_PER_MINUTE = 10;

// ── BIOMES ──
export const BIOMES: BiomeConfig[] = [
  {
    id: 'cimientos',
    name: 'Cimientos',
    emoji: '🏚️',
    startFloor: 1,
    endFloor: 1_000,
    bgGradient: ['#0a0612', '#0d0a1a', '#120e24', '#1a1008'],
  },
  {
    id: 'medieval',
    name: 'Pueblo Medieval',
    emoji: '🏘️',
    startFloor: 1_001,
    endFloor: 10_000,
    bgGradient: ['#0d0806', '#1a120a', '#12100e', '#0a0806'],
  },
  {
    id: 'ciudad',
    name: 'Ciudad Moderna',
    emoji: '🏙️',
    startFloor: 10_001,
    endFloor: 50_000,
    bgGradient: ['#060810', '#0a1020', '#101828', '#0a1015'],
  },
  {
    id: 'cielo',
    name: 'Cielo',
    emoji: '✈️',
    startFloor: 50_001,
    endFloor: 100_000,
    bgGradient: ['#0a1525', '#152540', '#1a3050', '#102030'],
  },
  {
    id: 'estratosfera',
    name: 'Estratósfera',
    emoji: '🛰️',
    startFloor: 100_001,
    endFloor: 250_000,
    bgGradient: ['#050510', '#0a0a20', '#0d0d2a', '#080818'],
  },
  {
    id: 'espacio',
    name: 'Espacio',
    emoji: '🚀',
    startFloor: 250_001,
    endFloor: 500_000,
    bgGradient: ['#020208', '#05050f', '#080815', '#030308'],
  },
  {
    id: 'galaxia',
    name: 'Galaxia',
    emoji: '🌌',
    startFloor: 500_001,
    endFloor: 750_000,
    bgGradient: ['#08020f', '#10051a', '#0d0815', '#06020a'],
  },
  {
    id: 'multiverso',
    name: 'Multiverso',
    emoji: '💎',
    startFloor: 750_001,
    endFloor: 999_999,
    bgGradient: ['#0a0515', '#120820', '#0f0a1a', '#080510'],
  },
];

// ── TIERS ──
export const TIERS: TierConfig[] = [
  { level: 1, name: 'Novato', emoji: '🧱', minFloors: 1, color: '#8b90a8' },
  { level: 2, name: 'Constructor', emoji: '🔨', minFloors: 10, color: '#68d391' },
  { level: 3, name: 'Arquitecto', emoji: '🏗️', minFloors: 50, color: '#00cec9' },
  { level: 4, name: 'Ingeniero', emoji: '⚡', minFloors: 200, color: '#a29bfe' },
  { level: 5, name: 'Titán', emoji: '💎', minFloors: 500, color: '#6c5ce7' },
  { level: 6, name: 'Leyenda', emoji: '👑', minFloors: 1_000, color: '#f0c040' },
  { level: 7, name: 'Mítico', emoji: '🌟', minFloors: 0, color: '#ff6b6b' }, // Top 10 only
];

// ── COIN PACKAGES ──
export const COIN_PACKAGES: CoinPackage[] = [
  {
    id: 'basic',
    coins: 500,
    price: 5,
    floors: 5,
    bonus: 0,
    emoji: '🪙',
    label: 'Básico',
  },
  {
    id: 'popular',
    coins: 1_100,
    price: 10,
    floors: 11,
    bonus: 10,
    emoji: '💰',
    label: 'Popular',
    popular: true,
  },
  {
    id: 'advanced',
    coins: 2_500,
    price: 20,
    floors: 25,
    bonus: 25,
    emoji: '💎',
    label: 'Avanzado',
  },
  {
    id: 'premium',
    coins: 6_000,
    price: 50,
    floors: 60,
    bonus: 20,
    emoji: '👑',
    label: 'Premium',
  },
  {
    id: 'elite',
    coins: 15_000,
    price: 100,
    floors: 150,
    bonus: 50,
    emoji: '🌟',
    label: 'Élite',
  },
];

// ── ANIMATION THRESHOLDS ──
export const ANIMATION_THRESHOLDS = {
  MINOR: 100,
  MEDIUM: 1_000,
  EPIC: 10_000,
  LEGENDARY: 100_000,
  HALF_EVENT: 500_000,
  COUNTDOWN: 999_000,
  GRAND_FINAL: 1_000_000,
} as const;

// ── SPECIAL FLOORS ──
export const HISTORIC_FLOORS = [1, 1_000, 10_000, 100_000, 500_000, 999_999, 1_000_000];

export function isPalindromeFloor(floor: number): boolean {
  const str = floor.toString();
  return str === str.split('').reverse().join('') && str.length >= 5;
}

export function isGoldenFloor(floor: number): boolean {
  return floor % 1_000 === 0;
}

export function isDiamondFloor(floor: number): boolean {
  return floor % 10_000 === 0;
}

// ── HELPERS ──
export function getBiome(floorNumber: number): BiomeConfig {
  const biome = BIOMES.find(
    (b) => floorNumber >= b.startFloor && floorNumber <= b.endFloor
  );
  // Floor 1,000,000 = crown (use multiverso as base)
  return biome || BIOMES[BIOMES.length - 1];
}

export function getTier(totalFloorsOwned: number): TierConfig {
  // Tiers 1-6 based on floors, tier 7 is Top 10 only (handled separately)
  for (let i = TIERS.length - 2; i >= 0; i--) {
    if (totalFloorsOwned >= TIERS[i].minFloors) {
      return TIERS[i];
    }
  }
  return TIERS[0];
}

export function getAnimationLevel(floorNumber: number): string {
  if (floorNumber === ANIMATION_THRESHOLDS.GRAND_FINAL) return 'grand_final';
  if (floorNumber === ANIMATION_THRESHOLDS.HALF_EVENT) return 'special';
  if (floorNumber % ANIMATION_THRESHOLDS.LEGENDARY === 0) return 'legendary';
  if (floorNumber % ANIMATION_THRESHOLDS.EPIC === 0) return 'epic';
  if (floorNumber % ANIMATION_THRESHOLDS.MEDIUM === 0) return 'medium';
  if (floorNumber % ANIMATION_THRESHOLDS.MINOR === 0) return 'minor';
  return 'standard';
}

export function formatFloorNumber(floor: number): string {
  return floor.toLocaleString('en-US');
}

export function formatCoins(coins: number): string {
  if (coins >= 1_000_000) return `${(coins / 1_000_000).toFixed(1)}M`;
  if (coins >= 1_000) return `${(coins / 1_000).toFixed(1)}K`;
  return coins.toString();
}

// ── COLORS (Design System) ──
export const COLORS = {
  bgDeep: '#07080d',
  bgSurface: '#0e1019',
  bgCard: '#141622',
  bgElevated: '#1a1d2e',
  bgHover: '#222640',
  accentPrimary: '#6c5ce7',
  accentGlow: '#a29bfe',
  accentGold: '#f0c040',
  accentGoldDim: '#b8941f',
  accentCyan: '#00cec9',
  accentPink: '#fd79a8',
  accentGreen: '#00b894',
  accentRed: '#ff6b6b',
  textPrimary: '#eef0f6',
  textSecondary: '#8b90a8',
  textDim: '#5a5f78',
  border: '#1e2235',
  borderGlow: 'rgba(108, 92, 231, 0.3)',
} as const;
