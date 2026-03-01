# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (choose platform)
npm start           # Expo dev server (scan QR with Expo Go)
npm run android     # Android emulator
npm run ios         # iOS simulator (macOS only)
npm run web         # Browser

# No test or lint scripts are configured yet
```

## Environment Setup

Copy `.env.example` to `.env` and fill in:
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key (secret key lives only in Supabase Edge Functions)

## Architecture

**Tower of Dreams** is a collaborative mobile game (React Native + Expo) where all users in the world jointly build a single tower of 1,000,000 floors by spending coins purchased with real money (Stripe). The entire game state lives in Supabase.

### Path Aliases (tsconfig.json)
`@/*` → root, `@/types` → `types/index.ts`, `@/lib/*` → `lib/`, `@/constants/*` → `constants/`, `@/components/*` → `components/`, `@/hooks/*` → `hooks/`

### Key Files

| File | Purpose |
|---|---|
| `lib/store.ts` | Zustand global state — `useAuthStore`, `useTowerStore`, `useWalletStore` |
| `lib/supabase.ts` | Supabase client — uses `expo-secure-store` on native, `localStorage` on web |
| `constants/game.ts` | All game constants + pure helper functions (`getBiome`, `getTier`, `getAnimationLevel`, `formatCoins`, etc.) + `COLORS` design tokens |
| `types/index.ts` | All TypeScript types for the entire app |
| `supabase/migrations/001_initial_schema.sql` | Full DB schema, RLS policies, functions, triggers, seed data |

### Data Flow

All game mutations go through the Supabase PostgreSQL function `contribute_to_floor(user_id, amount)` — it runs atomically and handles: wallet debit, contribution recording, floor ownership (top contributor becomes owner), floor completion, next floor creation, tower state update, tier recalculation, and animation event logging. **Never mutate game tables directly from the client.**

Real-time updates are pushed via Supabase Realtime channels (`tower-global` for tower state, `current-floor` for the active floor, `my-wallet` for the authenticated user's wallet).

### Game Concepts

- **Economy**: 100 coins = $1. Each floor costs exactly 100 coins total. Contributions are between 50–100 coins per action (rates enforced by DB).
- **Biomes**: 8 zones (Cimientos → Multiverso) each spanning a floor range. The `get_biome()` SQL function and `getBiome()` TS function must stay in sync.
- **Tiers 1–6**: Unlocked by floors owned. Tier 7 (Mítico) is reserved for top-10 leaderboard players and is handled separately.
- **Special floors**: `golden` (every ×1000), `diamond` (every ×10000), `historic` (milestone floors), `palindrome` (5+ digit palindromes). Determined by `get_special_type()` SQL function.
- **Animation levels**: `standard` → `minor` → `medium` → `epic` → `legendary` → `special` → `grand_final`, triggered on floor completion based on floor number.

### Database (Supabase)

Tables: `profiles`, `wallets`, `floors`, `contributions`, `payments`, `messages`, `badges`, `tower_state` (singleton, id=1), `animation_events`. RLS is enabled on all tables. Realtime is enabled on `tower_state`, `floors`, and `wallets`.

New users automatically get a `profiles` row and a `wallets` row created by the `handle_new_user()` trigger on `auth.users`.

To apply the schema to a fresh Supabase project, run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor.
