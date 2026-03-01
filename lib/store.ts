// ═══════════════════════════════════════
// TOWER OF DREAMS — Global State (Zustand)
// ═══════════════════════════════════════

import { create } from 'zustand';
import { supabase } from './supabase';
import type { UserProfile, TowerState, Wallet, Floor, RankedUser } from '@/types';

// ── AUTH STORE ──
interface AuthState {
  session: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  initialize: () => Promise<void>;
  setSession: (session: any) => void;
  fetchProfile: (userId: string) => Promise<void>;
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

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, isAuthenticated: !!session });
      if (session?.user) {
        await get().fetchProfile(session.user.id);
      } else {
        set({ profile: null });
      }
    });
  },

  setSession: (session) => {
    set({ session, isAuthenticated: !!session });
  },

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data && !error) {
      set({ profile: data as UserProfile });
    }
  },

  signOut: async () => {
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

  fetchTowerState: () => Promise<void>;
  fetchCurrentFloor: () => Promise<void>;
  fetchFloors: (startId: number, endId: number) => Promise<void>;
  subscribeToRealtime: () => void;
  unsubscribe: () => void;
}

export const useTowerStore = create<TowerStoreState>((set, get) => ({
  towerState: null,
  currentFloor: null,
  visibleFloors: [],
  isLoading: true,

  fetchTowerState: async () => {
    const { data } = await supabase
      .from('tower_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (data) {
      set({ towerState: data as TowerState });
    }
  },

  fetchCurrentFloor: async () => {
    const state = get().towerState;
    if (!state) return;

    const { data } = await supabase
      .from('floors')
      .select('*')
      .eq('id', state.current_floor)
      .single();

    if (data) {
      set({ currentFloor: data as Floor });
    }
  },

  fetchFloors: async (startId: number, endId: number) => {
    const { data } = await supabase
      .from('floors')
      .select('*')
      .gte('id', startId)
      .lte('id', endId)
      .order('id', { ascending: false });

    if (data) {
      set({ visibleFloors: data as Floor[], isLoading: false });
    }
  },

  subscribeToRealtime: () => {
    // Subscribe to tower state changes
    supabase
      .channel('tower-global')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tower_state',
        filter: 'id=eq.1',
      }, (payload) => {
        set({ towerState: payload.new as TowerState });
      })
      .subscribe();

    // Subscribe to current floor changes
    const state = get().towerState;
    if (state) {
      supabase
        .channel('current-floor')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'floors',
          filter: `id=eq.${state.current_floor}`,
        }, (payload) => {
          if (payload.eventType === 'UPDATE') {
            set({ currentFloor: payload.new as Floor });
          }
        })
        .subscribe();
    }
  },

  unsubscribe: () => {
    supabase.removeAllChannels();
  },
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
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      set({ wallet: data as Wallet, isLoading: false });
    }
  },

  subscribeToWallet: (userId: string) => {
    supabase
      .channel('my-wallet')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'wallets',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        set({ wallet: payload.new as Wallet });
      })
      .subscribe();
  },
}));
