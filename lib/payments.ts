// ═══════════════════════════════════════
// Stripe Payment Service
// ═══════════════════════════════════════

import { supabase } from './supabase';
import type { CoinPackage, CreatePaymentResponse } from '@/types';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

/**
 * Create a payment intent via Supabase Edge Function
 */
export async function createPaymentIntent(
  userId: string,
  pkg: CoinPackage
): Promise<CreatePaymentResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        user_id: userId,
        package_id: pkg.id,
        amount_usd: pkg.price,
        coins: pkg.coins,
      },
    });

    if (error) {
      return { client_secret: '', payment_id: '', error: error.message };
    }

    return data as CreatePaymentResponse;
  } catch (err: any) {
    return { client_secret: '', payment_id: '', error: err.message };
  }
}

/**
 * Confirm payment was successful and credit coins
 * This is called after Stripe confirms payment on the client
 */
export async function confirmPayment(
  userId: string,
  paymentId: string,
  packageId: string,
  coins: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('confirm-payment', {
      body: {
        user_id: userId,
        payment_id: paymentId,
        package_id: packageId,
        coins,
      },
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * DEV ONLY: Credit free coins for testing (bypasses Stripe)
 * Remove this in production!
 */
export async function creditTestCoins(
  userId: string,
  amount: number
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    // Direct wallet update for testing
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (fetchError || !wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    const { data, error } = await supabase
      .from('wallets')
      .update({
        balance: wallet.balance + amount,
        total_purchased: amount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('balance')
      .single();

    if (error) return { success: false, error: error.message };

    return { success: true, newBalance: data?.balance };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
