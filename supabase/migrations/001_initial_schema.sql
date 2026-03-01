-- ═══════════════════════════════════════════════════════════
-- TOWER OF DREAMS — Database Schema (Supabase / PostgreSQL)
-- ═══════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor to set up the entire database

-- ┌──────────────────────────────────────┐
-- │          TABLES                       │
-- └──────────────────────────────────────┘

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    tier INTEGER DEFAULT 1 CHECK (tier BETWEEN 1 AND 7),
    total_coins_spent INTEGER DEFAULT 0,
    total_floors_owned INTEGER DEFAULT 0,
    total_floors_contributed INTEGER DEFAULT 0,
    streak_current INTEGER DEFAULT 0,
    streak_last_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets
CREATE TABLE public.wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance INTEGER DEFAULT 0 CHECK (balance >= 0),
    total_purchased INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Floors
CREATE TABLE public.floors (
    id INTEGER PRIMARY KEY,
    status TEXT DEFAULT 'building' CHECK (status IN ('building', 'completed')),
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    owner_id UUID REFERENCES public.profiles(id),
    owner_contribution INTEGER DEFAULT 0,
    biome TEXT NOT NULL,
    is_special BOOLEAN DEFAULT FALSE,
    special_type TEXT CHECK (special_type IN ('golden', 'diamond', 'historic', 'palindrome', NULL)),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contributions
CREATE TABLE public.contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    floor_id INTEGER REFERENCES public.floors(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount INTEGER NOT NULL CHECK (amount BETWEEN 1 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    stripe_payment_id TEXT NOT NULL,
    amount_usd NUMERIC(10,2) NOT NULL,
    coins_credited INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (for chat, future use)
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    channel TEXT NOT NULL,
    content TEXT NOT NULL CHECK (char_length(content) <= 500),
    is_moderated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges
CREATE TABLE public.badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    badge_type TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

-- Tower State (singleton)
CREATE TABLE public.tower_state (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    current_floor INTEGER DEFAULT 1,
    total_floors_completed INTEGER DEFAULT 0,
    total_unique_builders INTEGER DEFAULT 0,
    total_coins_spent INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Animation Events (log for replay/analytics)
CREATE TABLE public.animation_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    floor_id INTEGER NOT NULL,
    animation_level TEXT NOT NULL,
    biome TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ┌──────────────────────────────────────┐
-- │          INDEXES                      │
-- └──────────────────────────────────────┘

CREATE INDEX idx_profiles_coins ON public.profiles(total_coins_spent DESC);
CREATE INDEX idx_profiles_floors ON public.profiles(total_floors_owned DESC);
CREATE INDEX idx_profiles_tier ON public.profiles(tier);
CREATE INDEX idx_profiles_username ON public.profiles(username);

CREATE INDEX idx_floors_status ON public.floors(status);
CREATE INDEX idx_floors_biome ON public.floors(biome);

CREATE INDEX idx_contributions_floor ON public.contributions(floor_id);
CREATE INDEX idx_contributions_user ON public.contributions(user_id);
CREATE INDEX idx_contributions_floor_user ON public.contributions(floor_id, user_id);

CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_stripe ON public.payments(stripe_payment_id);

CREATE INDEX idx_messages_channel ON public.messages(channel, created_at DESC);
CREATE INDEX idx_badges_user ON public.badges(user_id);


-- ┌──────────────────────────────────────┐
-- │          FUNCTIONS                    │
-- └──────────────────────────────────────┘

-- Get biome for a floor number
CREATE OR REPLACE FUNCTION get_biome(floor_number INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF floor_number <= 1000 THEN RETURN 'cimientos';
  ELSIF floor_number <= 10000 THEN RETURN 'medieval';
  ELSIF floor_number <= 50000 THEN RETURN 'ciudad';
  ELSIF floor_number <= 100000 THEN RETURN 'cielo';
  ELSIF floor_number <= 250000 THEN RETURN 'estratosfera';
  ELSIF floor_number <= 500000 THEN RETURN 'espacio';
  ELSIF floor_number <= 750000 THEN RETURN 'galaxia';
  ELSE RETURN 'multiverso';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get animation level for a floor number
CREATE OR REPLACE FUNCTION get_animation_level(floor_number INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF floor_number = 1000000 THEN RETURN 'grand_final';
  ELSIF floor_number = 500000 THEN RETURN 'special';
  ELSIF floor_number % 100000 = 0 THEN RETURN 'legendary';
  ELSIF floor_number % 10000 = 0 THEN RETURN 'epic';
  ELSIF floor_number % 1000 = 0 THEN RETURN 'medium';
  ELSIF floor_number % 100 = 0 THEN RETURN 'minor';
  ELSE RETURN 'standard';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get special floor type
CREATE OR REPLACE FUNCTION get_special_type(floor_number INTEGER)
RETURNS TEXT AS $$
DECLARE
  floor_str TEXT;
BEGIN
  IF floor_number IN (1, 1000, 10000, 100000, 500000, 999999, 1000000) THEN
    RETURN 'historic';
  ELSIF floor_number % 10000 = 0 THEN
    RETURN 'diamond';
  ELSIF floor_number % 1000 = 0 THEN
    RETURN 'golden';
  END IF;

  -- Check palindrome (5+ digits only)
  floor_str := floor_number::TEXT;
  IF char_length(floor_str) >= 5 AND floor_str = reverse(floor_str) THEN
    RETURN 'palindrome';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate tier from floors owned
CREATE OR REPLACE FUNCTION calculate_tier(floors_owned INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF floors_owned >= 1000 THEN RETURN 6;
  ELSIF floors_owned >= 500 THEN RETURN 5;
  ELSIF floors_owned >= 200 THEN RETURN 4;
  ELSIF floors_owned >= 50 THEN RETURN 3;
  ELSIF floors_owned >= 10 THEN RETURN 2;
  ELSIF floors_owned >= 1 THEN RETURN 1;
  ELSE RETURN 1;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ═══ MAIN FUNCTION: Contribute to floor ═══
CREATE OR REPLACE FUNCTION contribute_to_floor(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_current_floor INTEGER;
  v_wallet_balance INTEGER;
  v_floor_progress INTEGER;
  v_new_progress INTEGER;
  v_floor_completed BOOLEAN := FALSE;
  v_new_floor_id INTEGER;
  v_animation_level TEXT := 'standard';
  v_existing_contribution INTEGER;
  v_owner_id UUID;
  v_owner_amount INTEGER;
  v_user_total_floors INTEGER;
  v_new_tier INTEGER;
  v_old_tier INTEGER;
  v_tier_upgraded BOOLEAN := FALSE;
  v_biome TEXT;
  v_special_type TEXT;
BEGIN
  -- Validate amount
  IF p_amount < 1 OR p_amount > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  -- Get current floor
  SELECT current_floor INTO v_current_floor FROM tower_state WHERE id = 1;
  IF v_current_floor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tower not initialized');
  END IF;

  -- Check wallet balance
  SELECT balance INTO v_wallet_balance FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet_balance IS NULL OR v_wallet_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Get current floor progress
  SELECT progress INTO v_floor_progress FROM floors WHERE id = v_current_floor FOR UPDATE;

  -- Calculate how much can actually be contributed (don't exceed 100)
  IF v_floor_progress + p_amount > 100 THEN
    p_amount := 100 - v_floor_progress;
  END IF;

  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Floor already complete');
  END IF;

  v_new_progress := v_floor_progress + p_amount;

  -- Debit wallet
  UPDATE wallets
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record contribution
  INSERT INTO contributions (floor_id, user_id, amount)
  VALUES (v_current_floor, p_user_id, p_amount);

  -- Check if user is now the top contributor for this floor
  SELECT COALESCE(SUM(amount), 0) INTO v_existing_contribution
  FROM contributions
  WHERE floor_id = v_current_floor AND user_id = p_user_id;

  -- Get current owner
  SELECT owner_id, owner_contribution INTO v_owner_id, v_owner_amount
  FROM floors WHERE id = v_current_floor;

  -- Update owner if this user contributed more
  IF v_existing_contribution > COALESCE(v_owner_amount, 0) THEN
    UPDATE floors
    SET owner_id = p_user_id,
        owner_contribution = v_existing_contribution
    WHERE id = v_current_floor;
  END IF;

  -- Update floor progress
  UPDATE floors SET progress = v_new_progress WHERE id = v_current_floor;

  -- Update user stats
  UPDATE profiles
  SET total_coins_spent = total_coins_spent + p_amount,
      total_floors_contributed = total_floors_contributed + 1
  WHERE id = p_user_id;

  -- Check if floor is completed
  IF v_new_progress >= 100 THEN
    v_floor_completed := TRUE;
    v_animation_level := get_animation_level(v_current_floor);

    -- Mark floor as completed
    UPDATE floors
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = v_current_floor;

    -- Update owner's floors_owned count
    SELECT owner_id INTO v_owner_id FROM floors WHERE id = v_current_floor;
    IF v_owner_id IS NOT NULL THEN
      UPDATE profiles
      SET total_floors_owned = total_floors_owned + 1
      WHERE id = v_owner_id;
    END IF;

    -- Create next floor
    v_new_floor_id := v_current_floor + 1;
    IF v_new_floor_id <= 1000000 THEN
      v_biome := get_biome(v_new_floor_id);
      v_special_type := get_special_type(v_new_floor_id);

      INSERT INTO floors (id, status, progress, biome, is_special, special_type)
      VALUES (
        v_new_floor_id,
        'building',
        0,
        v_biome,
        v_special_type IS NOT NULL,
        v_special_type
      );

      -- Update tower state
      UPDATE tower_state
      SET current_floor = v_new_floor_id,
          total_floors_completed = total_floors_completed + 1,
          total_coins_spent = total_coins_spent + 100,
          updated_at = NOW()
      WHERE id = 1;
    END IF;

    -- Log animation event
    INSERT INTO animation_events (floor_id, animation_level, biome)
    VALUES (v_current_floor, v_animation_level, get_biome(v_current_floor));
  ELSE
    -- Update tower state coins
    UPDATE tower_state
    SET total_coins_spent = total_coins_spent + p_amount,
        updated_at = NOW()
    WHERE id = 1;
  END IF;

  -- Check tier upgrade
  SELECT total_floors_owned, tier INTO v_user_total_floors, v_old_tier
  FROM profiles WHERE id = p_user_id;

  v_new_tier := calculate_tier(v_user_total_floors);
  IF v_new_tier > v_old_tier THEN
    UPDATE profiles SET tier = v_new_tier WHERE id = p_user_id;
    v_tier_upgraded := TRUE;
  END IF;

  -- Get updated balance
  SELECT balance INTO v_wallet_balance FROM wallets WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'floor_completed', v_floor_completed,
    'new_floor_id', v_new_floor_id,
    'animation_level', v_animation_level,
    'new_balance', v_wallet_balance,
    'tier_upgraded', v_tier_upgraded,
    'new_tier', v_new_tier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ┌──────────────────────────────────────┐
-- │          TRIGGERS                     │
-- └──────────────────────────────────────┘

-- Auto-create profile + wallet on signup
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

  -- Update unique builders count
  UPDATE tower_state
  SET total_unique_builders = total_unique_builders + 1
  WHERE id = 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ┌──────────────────────────────────────┐
-- │     ROW LEVEL SECURITY (RLS)          │
-- └──────────────────────────────────────┘

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tower_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animation_events ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can update their own
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Wallets: only owner can see their wallet, no direct inserts/updates from client
CREATE POLICY "Users can view own wallet"
  ON public.wallets FOR SELECT USING (auth.uid() = user_id);

-- Floors: anyone can read
CREATE POLICY "Floors are viewable by everyone"
  ON public.floors FOR SELECT USING (true);

-- Contributions: anyone can read
CREATE POLICY "Contributions are viewable by everyone"
  ON public.contributions FOR SELECT USING (true);

-- Payments: only owner can see their payments
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT USING (auth.uid() = user_id);

-- Messages: anyone can read, authenticated can insert
CREATE POLICY "Messages are viewable by everyone"
  ON public.messages FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send messages"
  ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Badges: anyone can read
CREATE POLICY "Badges are viewable by everyone"
  ON public.badges FOR SELECT USING (true);

-- Tower State: anyone can read
CREATE POLICY "Tower state is viewable by everyone"
  ON public.tower_state FOR SELECT USING (true);

-- Animation Events: anyone can read
CREATE POLICY "Animation events are viewable by everyone"
  ON public.animation_events FOR SELECT USING (true);


-- ┌──────────────────────────────────────┐
-- │          REALTIME                     │
-- └──────────────────────────────────────┘

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tower_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.floors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;


-- ┌──────────────────────────────────────┐
-- │          SEED DATA                    │
-- └──────────────────────────────────────┘

-- Initialize tower state
INSERT INTO public.tower_state (id, current_floor, total_floors_completed, total_unique_builders, total_coins_spent)
VALUES (1, 1, 0, 0, 0);

-- Create first floor
INSERT INTO public.floors (id, status, progress, biome, is_special, special_type)
VALUES (1, 'building', 0, 'cimientos', TRUE, 'historic');
