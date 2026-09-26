export type UserRole = 'user' | 'moderator' | 'admin' | 'owner';

export type PlayerPosition = 'POR' | 'DFC' | 'LI' | 'LD' | 'MCD' | 'MC' | 'MCO' | 'EI' | 'ED' | 'DC';

export interface PlayerStats {
  pace: number;        // Velocidad
  shooting: number;    // Tiro
  passing: number;     // Pase
  dribbling: number;   // Regate
  defense: number;     // Defensa
  physical: number;    // Físico
}

export interface Player {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  nationality: string;
  nationality_flag?: string;
  position: PlayerPosition;
  rating: number;       // Valoración general (1-99)
  potential: number;    // Potencial (1-99)
  price: number;        // Valor de mercado / precio
  salary: number;       // Salario semanal
  club_id: string | null;
  club_name?: string;
  stats: PlayerStats;
  avatar_url: string;
  status: 'active' | 'listed' | 'auction' | 'injured';
  form: number;         // 1-10
  goals: number;
  assists: number;
  matches_played: number;
  is_starter?: boolean;
  created_at: string;
}

export interface Club {
  id: string;
  owner_id: string;
  name: string;
  short_name: string;
  crest_url: string;
  banner_url: string;
  description: string;
  budget: number;
  valuation: number;
  division_tier: number;
  league_id: string;
  formation: '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1';
  matches_played: number;
  matches_won: number;
  matches_drawn: number;
  matches_lost: number;
  goals_for: number;
  goals_against: number;
  trophies_count: number;
  primary_kit_color?: string; // Hex color for jersey main
  secondary_kit_color?: string; // Hex color for stripes/accents
  accent_kit_color?: string; // Hex color for details/borders
  kit_pattern?: 'solid' | 'stripes' | 'hoops' | 'sash' | 'gradient' | 'halves' | 'checkered' | 'chevron' | 'pinstripes' | 'sleeves_contrast'; // Pattern
  collar_type?: 'round' | 'v-neck' | 'polo';
  active_sponsor_id?: string | null;
  created_at: string;
}

export interface Sponsor {
  id: string;
  name: string;
  category: string;
  icon_url: string;
  match_bonus: number;
  payout_per_match?: number;
  signing_bonus: number;
  requirement_tier: number; // Required minimum division tier
  contract_duration_matches?: number;
  description: string;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  coins: number;
  role: UserRole;
  premium_active: boolean;
  premium_expires_at: string | null;
  club_id: string | null;
  status: 'active' | 'suspended';
  password_hash?: string;
  bio?: string;
  nationality?: string;
  tactical_style?: string;
  theme_color?: string; // Custom theme color for premium users
  created_at: string;
}

export interface League {
  id: string;
  title: string;
  logo_url: string;
  banner_url: string;
  description: string;
  tier: number;
  promotion_league_id: string | null;
  relegation_league_id: string | null;
  clubs_count: number;
  season: string;
  created_at: string;
}

export interface Standing {
  id: string;
  league_id: string;
  club_id: string;
  club_name: string;
  crest_url: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
}

export interface Match {
  id: string;
  league_id: string;
  matchday: number;
  home_club_id: string;
  away_club_id: string;
  home_club_name: string;
  away_club_name: string;
  home_crest: string;
  away_crest: string;
  home_score: number | null;
  away_score: number | null;
  status: 'scheduled' | 'live' | 'finished';
  events?: string[];
  scheduled_start?: string;
  scheduled_end?: string;
  is_daily?: boolean;
  daily_slot?: 1 | 2;
  tactics?: { mentality: 'defensive' | 'balanced' | 'attacking' | 'all_out_attack'; formation: string };
  detailed_events?: { minute: number; second: number; text: string; type: 'goal' | 'card' | 'save' | 'tactic' | 'whistle' | 'info' }[];
  played_at: string;
}

export interface TransferListing {
  id: string;
  player_id: string;
  player: Player;
  seller_club_id: string;
  seller_club_name: string;
  asking_price: number;
  created_at: string;
  status: 'active' | 'sold' | 'cancelled';
}

export interface TransferOffer {
  id: string;
  listing_id: string;
  player_id: string;
  buyer_club_id: string;
  buyer_club_name: string;
  offer_amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface Auction {
  id: string;
  player_id: string;
  player: Player;
  starting_bid: number;
  current_bid: number;
  highest_bidder_id: string | null;
  highest_bidder_club_name: string | null;
  starts_at: string;
  ends_at: string;
  status: 'active' | 'completed' | 'expired';
}

export interface AuctionBid {
  id: string;
  auction_id: string;
  bidder_id: string;
  bidder_club_name: string;
  amount: number;
  created_at: string;
}

export interface Trophy {
  id: string;
  title: string;
  name?: string;
  image_url: string;
  icon?: string;
  tier?: number;
  description: string;
  league_id: string | null;
  season: string;
  condition: string;
  club_id?: string;
  unlocked_at?: string;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: 'matches' | 'transfers' | 'club' | 'economy';
  reward_coins: number;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface CosmeticItem {
  id: string;
  name: string;
  image_url: string;
  type: 'banner' | 'logo' | 'icon' | 'badge';
  is_premium: boolean;
  description: string;
  obtained: boolean;
}

export interface RewardCode {
  id: string;
  code: string;
  reward_type: 'coins' | 'premium' | 'cosmetic';
  reward_value: number;
  max_uses: number;
  uses_count: number;
  expires_at: string | null;
  is_active: boolean;
}

export interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'reward_code' | 'transfer_buy' | 'transfer_sell' | 'auction_bid' | 'auction_refund' | 'match_bonus' | 'admin_grant';
  description: string;
  reference_id?: string;
  created_at: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  admin_username: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  created_at: string;
}

export interface AppSettings {
  app_name: string;
  favicon_url: string;
  logo_url: string;
  maintenance_mode: boolean;
  registration_open: boolean;
}
