-- ============================================================
-- NERVA FOOTBALL MANAGER - SUPABASE POSTGRESQL SCHEMA
-- Migration: 20260925_init_nerva.sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES / USERS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  coins BIGINT DEFAULT 150000 CHECK (coins >= 0),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'owner')),
  premium_active BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMPTZ,
  club_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CLUBS
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT UNIQUE NOT NULL,
  short_name VARCHAR(4) NOT NULL,
  crest_url TEXT NOT NULL,
  banner_url TEXT NOT NULL,
  description TEXT DEFAULT '',
  budget BIGINT DEFAULT 500000 CHECK (budget >= 0),
  valuation BIGINT DEFAULT 1200000,
  division_tier INT DEFAULT 1,
  league_id UUID,
  formation TEXT DEFAULT '4-3-3',
  matches_played INT DEFAULT 0,
  matches_won INT DEFAULT 0,
  matches_drawn INT DEFAULT 0,
  matches_lost INT DEFAULT 0,
  goals_for INT DEFAULT 0,
  goals_against INT DEFAULT 0,
  trophies_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circular FK link for profiles.club_id
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS fk_profiles_club,
  ADD CONSTRAINT fk_profiles_club FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE SET NULL;

-- 3. LEAGUES
CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT UNIQUE NOT NULL,
  logo_url TEXT NOT NULL,
  banner_url TEXT NOT NULL,
  description TEXT DEFAULT '',
  tier INT NOT NULL DEFAULT 1,
  promotion_league_id UUID REFERENCES public.leagues(id) ON DELETE SET NULL,
  relegation_league_id UUID REFERENCES public.leagues(id) ON DELETE SET NULL,
  clubs_count INT DEFAULT 10,
  season TEXT DEFAULT '2026/2027',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link clubs to leagues
ALTER TABLE public.clubs
  DROP CONSTRAINT IF EXISTS fk_clubs_league,
  ADD CONSTRAINT fk_clubs_league FOREIGN KEY (league_id) REFERENCES public.leagues(id) ON DELETE SET NULL;

-- 4. PLAYERS
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INT NOT NULL CHECK (age >= 15 AND age <= 45),
  nationality TEXT NOT NULL,
  nationality_flag TEXT DEFAULT '',
  position TEXT NOT NULL CHECK (position IN ('POR', 'DFC', 'LI', 'LD', 'MCD', 'MC', 'MCO', 'EI', 'ED', 'DC')),
  rating INT NOT NULL CHECK (rating >= 40 AND rating <= 99),
  potential INT NOT NULL CHECK (potential >= rating AND potential <= 99),
  price BIGINT NOT NULL CHECK (price >= 0),
  salary BIGINT NOT NULL CHECK (salary >= 0),
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  avatar_url TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'listed', 'auction', 'injured')),
  form INT DEFAULT 7 CHECK (form >= 1 AND form <= 10),
  goals INT DEFAULT 0,
  assists INT DEFAULT 0,
  matches_played INT DEFAULT 0,
  is_starter BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PLAYER_STATS
CREATE TABLE IF NOT EXISTS public.player_stats (
  player_id UUID PRIMARY KEY REFERENCES public.players(id) ON DELETE CASCADE,
  pace INT NOT NULL CHECK (pace BETWEEN 30 AND 99),
  shooting INT NOT NULL CHECK (shooting BETWEEN 30 AND 99),
  passing INT NOT NULL CHECK (passing BETWEEN 30 AND 99),
  dribbling INT NOT NULL CHECK (dribbling BETWEEN 30 AND 99),
  defense INT NOT NULL CHECK (defense BETWEEN 30 AND 99),
  physical INT NOT NULL CHECK (physical BETWEEN 30 AND 99)
);

-- 6. STANDINGS
CREATE TABLE IF NOT EXISTS public.standings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  played INT DEFAULT 0,
  won INT DEFAULT 0,
  drawn INT DEFAULT 0,
  lost INT DEFAULT 0,
  goals_for INT DEFAULT 0,
  goals_against INT DEFAULT 0,
  goal_diff INT DEFAULT 0,
  points INT DEFAULT 0,
  UNIQUE(league_id, club_id)
);

-- 7. MATCHES
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  matchday INT NOT NULL,
  home_club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  away_club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  home_score INT,
  away_score INT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
  events JSONB DEFAULT '[]'::jsonb,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TRANSFERS & LISTINGS
CREATE TABLE IF NOT EXISTS public.transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  seller_club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  buyer_club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  asking_price BIGINT NOT NULL CHECK (asking_price > 0),
  final_price BIGINT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 9. TRANSFER OFFERS
CREATE TABLE IF NOT EXISTS public.transfer_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id UUID NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  buyer_club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  offer_amount BIGINT NOT NULL CHECK (offer_amount > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AUCTIONS
CREATE TABLE IF NOT EXISTS public.auctions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  seller_club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  starting_bid BIGINT NOT NULL CHECK (starting_bid > 0),
  current_bid BIGINT NOT NULL CHECK (current_bid >= starting_bid),
  highest_bidder_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired'))
);

-- 11. AUCTION BIDS
CREATE TABLE IF NOT EXISTS public.auction_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TROPHIES & CLUB TROPHIES
CREATE TABLE IF NOT EXISTS public.trophies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT NOT NULL,
  league_id UUID REFERENCES public.leagues(id) ON DELETE SET NULL,
  season TEXT DEFAULT '2026/2027',
  condition TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_trophies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  trophy_id UUID NOT NULL REFERENCES public.trophies(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ACHIEVEMENTS & USER ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('matches', 'transfers', 'club', 'economy')),
  reward_coins BIGINT DEFAULT 10000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- 14. COSMETICS & USER COSMETICS
CREATE TABLE IF NOT EXISTS public.cosmetics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('banner', 'logo', 'icon', 'badge')),
  is_premium BOOLEAN DEFAULT false,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_cosmetics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cosmetic_id UUID NOT NULL REFERENCES public.cosmetics(id) ON DELETE CASCADE,
  obtained_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cosmetic_id)
);

-- 15. REWARD CODES & USES
CREATE TABLE IF NOT EXISTS public.reward_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('coins', 'premium', 'cosmetic')),
  reward_value BIGINT NOT NULL,
  max_uses INT DEFAULT 1000000,
  uses_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reward_code_uses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_id UUID NOT NULL REFERENCES public.reward_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code_id, user_id)
);

-- 16. PREMIUM CODES & USES
CREATE TABLE IF NOT EXISTS public.premium_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  duration_days INT DEFAULT 7,
  max_uses INT DEFAULT 1,
  uses_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.premium_code_uses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_id UUID NOT NULL REFERENCES public.premium_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code_id, user_id)
);

-- 17. COIN TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reward_code', 'transfer_buy', 'transfer_sell', 'auction_bid', 'auction_refund', 'match_bonus', 'admin_grant')),
  description TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. ADMIN ACTIONS
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. APP SETTINGS
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_clubs_league ON public.clubs(league_id);
CREATE INDEX IF NOT EXISTS idx_clubs_owner ON public.clubs(owner_id);
CREATE INDEX IF NOT EXISTS idx_players_club ON public.players(club_id);
CREATE INDEX IF NOT EXISTS idx_players_position ON public.players(position);
CREATE INDEX IF NOT EXISTS idx_players_rating ON public.players(rating DESC);
CREATE INDEX IF NOT EXISTS idx_matches_league_matchday ON public.matches(league_id, matchday);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON public.transfers(status);
CREATE INDEX IF NOT EXISTS idx_auctions_ends_at ON public.auctions(ends_at, status);
CREATE INDEX IF NOT EXISTS idx_reward_codes_code ON public.reward_codes(UPPER(code));
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON public.coin_transactions(user_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trophies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can view basic profile; User can edit only display_name / avatar
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own display profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    -- Prevent modifying coins, role, premium directly from client
    coins = (SELECT coins FROM public.profiles WHERE id = auth.uid()) AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
    premium_active = (SELECT premium_active FROM public.profiles WHERE id = auth.uid())
  );

-- Players, Leagues, Trophies: Read by everyone, write only by service_role or admin
CREATE POLICY "Players are viewable by everyone" ON public.players FOR SELECT USING (true);
CREATE POLICY "Leagues are viewable by everyone" ON public.leagues FOR SELECT USING (true);
CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Standings are viewable by everyone" ON public.standings FOR SELECT USING (true);
CREATE POLICY "Trophies are viewable by everyone" ON public.trophies FOR SELECT USING (true);
CREATE POLICY "Transfers are viewable by everyone" ON public.transfers FOR SELECT USING (true);
CREATE POLICY "Auctions are viewable by everyone" ON public.auctions FOR SELECT USING (true);

-- Transactions: User can only read their own transactions
CREATE POLICY "Users can view own coin transactions" ON public.coin_transactions
  FOR SELECT USING (auth.uid() = user_id);
