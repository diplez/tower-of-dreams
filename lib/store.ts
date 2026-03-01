// ═══════════════════════════════════════
// TOWER OF DREAMS — Global State (Zustand)
// ═══════════════════════════════════════

import { create } from 'zustand';
import { supabase } from './supabase';
import type { UserProfile, TowerState, Wallet, Floor, RankedUser, ContributeResponse } from '@/types';

// ── AUTH STORE ──
interface AuthState {
  session: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  setSession: (session: any) => void;
  fetchProfile: (userId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ session, isAuthenticated: true });
        await get().fetchProfile(session.user.id);
      }
    } catch (error) {
      console.error('Auth init error:', error);
    } finally {
      set({ isLoading: false });
    }
    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, isAuthenticated: !!session });
      if (session?.user) {
        await get().fetchProfile(session.user.id);
      } else {
        set({ profile: null });
      }
    });
  },

  setSession: (session) => set({ session, isAuthenticated: !!session }),

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', userId).single();
    if (data && !error) set({ profile: data as UserProfile });
  },

  refreshProfile: async () => {
    const session = get().session;
    if (session?.user) await get().fetchProfile(session.user.id);
  },

  signOut: async () => {
    useTowerStore.getState().unsubscribe();
    await supabase.auth.signOut();
    set({ session: null, profile: null, isAuthenticated: false });
  },
}));

// ── TOWER STORE ──
interface TowerStoreState {
  towerState: TowerState | null;
  currentFloor: Floor | null;
  visibleFloors: Floor[];
  isLoading: boolean;
  lastAnimationEvent: { floorId: number; level: string } | null;
  fetchTowerState: () => Promise<void>;
  fetchCurrentFloor: () => Promise<void>;
  fetchFloors: (aroundFloor: number, range?: number) => Promise<void>;
  contributeToFloor: (userId: string, amount: number) => Promise<ContributeResponse>;
  subscribeToRealtime: () => void;
  resubscribeToCurrentFloor: (floorId: number) => void;
  unsubscribe: () => void;
  clearAnimation: () => void;
}

export const useTowerStore = create<TowerStoreState>((set, get) => ({
  towerState: null,
  currentFloor: null,
  visibleFloors: [],
  isLoading: true,
  lastAnimationEvent: null,

  fetchTowerState: async () => {
    const { data } = await supabase
      .from('tower_state').select('*').eq('id', 1).single();
    if (data) set({ towerState: data as TowerState });
  },

  fetchCurrentFloor: async () => {
    const state = get().towerState;
    if (!state) return;
    const { data } = await supabase
      .from('floors').select('*').eq('id', state.current_floor).single();
    if (data) set({ currentFloor: data as Floor, isLoading: false });
  },

  fetchFloors: async (aroundFloor: number, range: number = 25) => {
    const startId = Math.max(1, aroundFloor - range);
    const endId = aroundFloor + 2;
    const { data } = await supabase
      .from('floors').select('*')
      .gte('id', startId).lte('id', endId)
      .order('id', { ascending: false });
    if (data) set({ visibleFloors: data as Floor[], isLoading: false });
  },

  contributeToFloor: async (userId: string, amount: number): Promise<ContributeResponse> => {
    try {
      const { data, error } = await supabase.rpc('contribute_to_floor', {
        p_user_id: userId,
        p_amount: amount,
      });

      if (error) {
        return { success: false, floor_completed: false, animation_level: null, new_balance: 0, tier_upgraded: false, error: error.message };
      }

      const result = data as ContributeResponse;

      if (result.success) {
        await get().fetchTowerState();
        await get().fetchCurrentFloor();

        if (result.floor_completed && result.new_floor_id) {
          get().resubscribeToCurrentFloor(result.new_floor_id);
          await get().fetchFloors(result.new_floor_id);
        }

        if (result.animation_level && result.animation_level !== 'standard') {
          const ts = get().towerState;
          set({ lastAnimationEvent: { floorId: ts?.current_floor || 0, level: result.animation_level } });
        }

        await useWalletStore.getState().fetchWallet(userId);
        await useAuthStore.getState().refreshProfile();
      }

      return result;
    } catch (err: any) {
      return { success: false, floor_completed: false, animation_level: null, new_balance: 0, tier_upgraded: false, error: err.message || 'Unknown error' };
    }
  },

  subscribeToRealtime: () => {
    supabase
      .channel('tower-global')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tower_state', filter: 'id=eq.1' },
        async (payload) => {
          const newState = payload.new as TowerState;
          const oldState = get().towerState;
          set({ towerState: newState });
          if (oldState && newState.current_floor !== oldState.current_floor) {
            await get().fetchCurrentFloor();
            await get().fetchFloors(newState.current_floor);
            get().resubscribeToCurrentFloor(newState.current_floor);
          }
        })
      .subscribe();

    const state = get().towerState;
    if (state) get().resubscribeToCurrentFloor(state.current_floor);
  },

  resubscribeToCurrentFloor: (floorId: number) => {
    supabase.removeChannel(supabase.channel('current-floor'));
    supabase
      .channel('current-floor')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'floors', filter: `id=eq.${floorId}` },
        (payload) => { set({ currentFloor: payload.new as Floor }); })
      .subscribe();
  },

  unsubscribe: () => { supabase.removeAllChannels(); },
  clearAnimation: () => { set({ lastAnimationEvent: null }); },
}));

// ── WALLET STORE ──
interface WalletStoreState {
  wallet: Wallet | null;
  isLoading: boolean;
  fetchWallet: (userId: string) => Promise<void>;
  subscribeToWallet: (userId: string) => void;
}

export const useWalletStore = create<WalletStoreState>((set) => ({
  wallet: null,
  isLoading: true,

  fetchWallet: async (userId: string) => {
    const { data } = await supabase
      .from('wallets').select('*').eq('user_id', userId).single();
    set({ wallet: data ? (data as Wallet) : null, isLoading: false });
  },

  subscribeToWallet: (userId: string) => {
    supabase
      .channel('my-wallet')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${userId}` },
        (payload) => { set({ wallet: payload.new as Wallet }); })
      .subscribe();
  },
}));

// ── RANKINGS STORE ──
interface RankingsStoreState {
  rankings: RankedUser[];
  myRank: RankedUser | null;
  isLoading: boolean;
  fetchRankings: (userId?: string) => Promise<void>;
}

export const useRankingsStore = create<RankingsStoreState>((set) => ({
  rankings: [],
  myRank: null,
  isLoading: true,

  fetchRankings: async (userId?: string) => {
    const { data, error } = await supabase
      .from('profiles').select('*')
      .gt('total_coins_spent', 0)
      .order('total_coins_spent', { ascending: false })
      .limit(50);
    if (data && !error) {
      const ranked = data.map((user, index) => ({ ...user, position: index + 1 })) as RankedUser[];
      const myRank = userId ? ranked.find((u) => u.id === userId) || null : null;
      set({ rankings: ranked, myRank, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));
