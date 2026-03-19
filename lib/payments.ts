// ═══════════════════════════════════════
// Stripe Payment Service
// ═══════════════════════════════════════

import { Platform } from 'react-native';
import { supabase } from './supabase';
import type { CoinPackage, CreatePaymentResponse } from '@/types';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Lazy-load Stripe.js (web only)
let stripePromise: Promise<any> | null = null;

function getStripe() {
  if (Platform.OS !== 'web') return null;
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    // Dynamic import to avoid SSR issues
    stripePromise = import('@stripe/stripe-js').then(({ loadStripe }) =>
      loadStripe(STRIPE_PUBLISHABLE_KEY)
    );
  }
  return stripePromise;
}

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
 * Full payment flow for web:
 * 1. Creates PaymentIntent via Edge Function
 * 2. Opens Stripe Payment Element / Card form
 * 3. Confirms payment
 * 4. Calls confirm-payment Edge Function to credit coins
 */
export async function processPaymentWeb(
  userId: string,
  pkg: CoinPackage
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Create PaymentIntent
    const intentResult = await createPaymentIntent(userId, pkg);
    if (intentResult.error || !intentResult.client_secret) {
      return { success: false, error: intentResult.error || 'No se pudo crear el pago' };
    }

    // 2. Load Stripe
    const stripe = await getStripe();
    if (!stripe) {
      return { success: false, error: 'Stripe no está disponible' };
    }

    // 3. Confirm payment with Stripe Payment Element
    const { error: stripeError } = await stripe.confirmPayment({
      clientSecret: intentResult.client_secret,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required',
    });

    if (stripeError) {
      if (stripeError.type === 'card_error' || stripeError.type === 'validation_error') {
        return { success: false, error: stripeError.message };
      }
      return { success: false, error: 'Error procesando el pago' };
    }

    // 4. Confirm and credit coins via Edge Function (backup to webhook)
    await confirmPayment(userId, intentResult.payment_id, pkg.id, pkg.coins);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Simple Stripe Checkout redirect (alternative flow)
 * Creates a PaymentIntent and uses Stripe's built-in payment UI
 */
export async function openStripeCheckout(
  userId: string,
  pkg: CoinPackage
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Create PaymentIntent
    const intentResult = await createPaymentIntent(userId, pkg);
    if (intentResult.error || !intentResult.client_secret) {
      return { success: false, error: intentResult.error || 'No se pudo crear el pago' };
    }

    // 2. Load Stripe
    const stripe = await getStripe();
    if (!stripe) {
      return { success: false, error: 'Stripe no está disponible' };
    }

    // 3. Create and mount Payment Element in a modal
    const elements = stripe.elements({
      clientSecret: intentResult.client_secret,
      appearance: {
        theme: 'night',
        variables: {
          colorPrimary: '#6c5ce7',
          colorBackground: '#0e1019',
          colorText: '#eef0f6',
          colorDanger: '#ff6b6b',
          borderRadius: '12px',
          fontFamily: 'monospace',
        },
      },
    });

    // Create a modal container
    const modal = document.createElement('div');
    modal.id = 'stripe-payment-modal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.85); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background: #141622; border-radius: 16px; padding: 24px;
      width: 90%; max-width: 420px; border: 1px solid #1e2235;
      box-shadow: 0 20px 60px rgba(108,92,231,0.2);
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'text-align: center; margin-bottom: 20px;';
    header.innerHTML = `
      <div style="font-size: 32px; margin-bottom: 8px;">${pkg.emoji}</div>
      <div style="color: #eef0f6; font-size: 18px; font-weight: 800; font-family: monospace; letter-spacing: 2px;">
        ${pkg.coins.toLocaleString()} MONEDAS
      </div>
      <div style="color: #8b90a8; font-size: 14px; margin-top: 4px;">
        $${pkg.price} USD
      </div>
    `;
    card.appendChild(header);

    // Payment element container
    const paymentContainer = document.createElement('div');
    paymentContainer.id = 'payment-element';
    card.appendChild(paymentContainer);

    // Buttons
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 20px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.style.cssText = `
      flex: 1; padding: 14px; border-radius: 12px; border: 1px solid #1e2235;
      background: #0e1019; color: #8b90a8; font-size: 14px; font-weight: 700;
      cursor: pointer; font-family: monospace; letter-spacing: 1px;
    `;

    const payBtn = document.createElement('button');
    payBtn.textContent = `PAGAR $${pkg.price}`;
    payBtn.style.cssText = `
      flex: 2; padding: 14px; border-radius: 12px; border: none;
      background: #6c5ce7; color: #fff; font-size: 14px; font-weight: 800;
      cursor: pointer; font-family: monospace; letter-spacing: 2px;
    `;

    // Status message
    const statusMsg = document.createElement('div');
    statusMsg.style.cssText = 'text-align: center; margin-top: 12px; font-size: 13px; min-height: 20px;';

    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(payBtn);
    card.appendChild(btnContainer);
    card.appendChild(statusMsg);
    modal.appendChild(card);
    document.body.appendChild(modal);

    // Mount payment element
    const paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');

    // Return a promise that resolves on pay or cancel
    return new Promise((resolve) => {
      cancelBtn.onclick = () => {
        document.body.removeChild(modal);
        resolve({ success: false, error: 'Pago cancelado' });
      };

      modal.onclick = (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
          resolve({ success: false, error: 'Pago cancelado' });
        }
      };

      payBtn.onclick = async () => {
        payBtn.disabled = true;
        payBtn.textContent = 'PROCESANDO...';
        statusMsg.style.color = '#00cec9';
        statusMsg.textContent = 'Procesando pago...';

        const { error: stripeError } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.href,
          },
          redirect: 'if_required',
        });

        if (stripeError) {
          payBtn.disabled = false;
          payBtn.textContent = `PAGAR $${pkg.price}`;
          statusMsg.style.color = '#ff6b6b';
          statusMsg.textContent = stripeError.message || 'Error en el pago';
          return;
        }

        // Success!
        statusMsg.style.color = '#00b894';
        statusMsg.textContent = '✅ ¡Pago exitoso! Acreditando monedas...';

        // Credit coins via Edge Function
        await confirmPayment(userId, intentResult.payment_id, pkg.id, pkg.coins);

        setTimeout(() => {
          document.body.removeChild(modal);
          resolve({ success: true });
        }, 1500);
      };
    });
  } catch (err: any) {
    // Clean up modal if exists
    const modal = document.getElementById('stripe-payment-modal');
    if (modal) document.body.removeChild(modal);
    return { success: false, error: err.message };
  }
}

/**
 * Confirm payment was successful and credit coins
 * Backup to webhook — ensures coins are credited even if webhook is slow
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
