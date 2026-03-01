-- ═══════════════════════════════════════════════════════════
-- FIX: handle_new_user — agregar schema público a tower_state
-- Corre esto en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::TEXT, 8)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0);

  UPDATE public.tower_state
  SET total_unique_builders = total_unique_builders + 1
  WHERE id = 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
