// ═══════════════════════════════════════
// Edge Function: confirm-payment
// ═══════════════════════════════════════
// Fallback confirmation from client side
// Primary flow should be via stripe-webhook

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { user_id, payment_id, package_id, coins } = await req.json();

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_id);

    if (paymentIntent.status !== 'succeeded') {
      return new Response(
        JSON.stringify({ error: 'Payment not yet succeeded' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already processed
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('stripe_payment_id', payment_id)
      .eq('status', 'completed')
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, message: 'Already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Credit coins
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance, total_purchased')
      .eq('user_id', user_id)
      .single();

    if (wallet) {
      await supabase
        .from('wallets')
        .update({
          balance: wallet.balance + coins,
          total_purchased: wallet.total_purchased + coins,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id);
    }

    // Record payment
    await supabase.from('payments').upsert({
      user_id,
      stripe_payment_id: payment_id,
      amount_usd: paymentIntent.amount / 100,
      coins_credited: coins,
      status: 'completed',
    }, { onConflict: 'stripe_payment_id' });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
