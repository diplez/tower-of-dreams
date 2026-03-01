// ═══════════════════════════════════════
// Edge Function: stripe-webhook
// ═══════════════════════════════════════
// Deploy: supabase functions deploy stripe-webhook
// Set secrets:
//   supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
// Configure webhook URL in Stripe Dashboard:
//   https://<project-ref>.supabase.co/functions/v1/stripe-webhook

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { user_id, package_id, coins } = paymentIntent.metadata;

      if (!user_id || !coins) {
        console.error('Missing metadata in payment intent');
        return new Response('Missing metadata', { status: 400 });
      }

      const coinsAmount = parseInt(coins, 10);

      // Record payment
      await supabase.from('payments').insert({
        user_id,
        stripe_payment_id: paymentIntent.id,
        amount_usd: paymentIntent.amount / 100,
        coins_credited: coinsAmount,
        status: 'completed',
      });

      // Credit coins to wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance, total_purchased')
        .eq('user_id', user_id)
        .single();

      if (wallet) {
        await supabase
          .from('wallets')
          .update({
            balance: wallet.balance + coinsAmount,
            total_purchased: wallet.total_purchased + coinsAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user_id);
      }

      console.log(`✅ Credited ${coinsAmount} coins to user ${user_id}`);
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { user_id } = paymentIntent.metadata;

      // Record failed payment
      await supabase.from('payments').insert({
        user_id: user_id || 'unknown',
        stripe_payment_id: paymentIntent.id,
        amount_usd: paymentIntent.amount / 100,
        coins_credited: 0,
        status: 'failed',
      });

      console.log(`❌ Payment failed for ${paymentIntent.id}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
