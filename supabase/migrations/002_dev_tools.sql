-- ═══════════════════════════════════════════════════════════
-- Migration 002: Dev tools + RLS fixes
-- ═══════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor

-- Function to credit test coins (DEV ONLY - remove in production)
CREATE OR REPLACE FUNCTION credit_test_coins(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM wallets WHERE user_id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  -- Credit coins
  UPDATE wallets
  SET balance = balance + p_amount,
      total_purchased = total_purchased + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
