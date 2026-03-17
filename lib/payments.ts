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
 * Requires: Run supabase/migrations/002_dev_tools.sql first
 * Remove this in production!
 */
export async function creditTestCoins(
  userId: string,
  amount: number
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('credit_test_coins', {
      p_user_id: userId,
      p_amount: amount,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; new_balance?: number; error?: string };

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to credit coins' };
    }

    return { success: true, newBalance: result.new_balance };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
