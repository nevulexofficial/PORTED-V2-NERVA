import fs from 'fs';
import path from 'path';
import { 
  Profile, Club, Player, League, Standing, Match, 
  TransferListing, TransferOffer, Auction, AuctionBid, 
  Trophy, Achievement, CosmeticItem, RewardCode, CoinTransaction, 
  AdminAction, AppSettings, Sponsor, SponsorOffer, ClubPost, NotificationItem, BackgroundTrack
} from '../types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nerva_db.json');

export interface DatabaseSchema {
  profiles: Profile[];
  clubs: Club[];
  players: Player[];
  leagues: League[];
  standings: Standing[];
  matches: Match[];
  transfers: TransferListing[];
  transfer_offers: TransferOffer[];
  auctions: Auction[];
  auction_bids: AuctionBid[];
  trophies: Trophy[];
  sponsors: Sponsor[];
  sponsor_offers: SponsorOffer[];
  club_posts: ClubPost[];
  notifications: NotificationItem[];
  background_tracks: BackgroundTrack[];
  achievements: Achievement[];
  user_achievements: { user_id: string; achievement_id: string; unlocked_at: string }[];
  cosmetics: CosmeticItem[];
  user_cosmetics: { user_id: string; cosmetic_id: string; obtained_at: string }[];
  reward_codes: RewardCode[];
  reward_code_uses: { code_id: string; user_id: string; used_at: string }[];
  premium_codes: { id: string; code: string; duration_days: number; max_uses: number; uses_count: number; is_active: boolean }[];
  premium_code_uses: { code_id: string; user_id: string; used_at: string }[];
  coin_transactions: CoinTransaction[];
  admin_actions: AdminAction[];
  app_settings: AppSettings;
}

// Initial High-Fidelity Football Seed Data
function getInitialData(): DatabaseSchema {
  const brandLogo = '/src/assets/images/nerva_brand_logo_1790393799448.jpg';
  const stadiumBanner = '/src/assets/images/stadium_banner_pitch_1790393808701.jpg';
  const crestTitan = '/src/assets/images/crest_titan_fc_1790393819091.jpg';
  const crestVanguard = '/src/assets/images/crest_vanguard_cf_1790393833910.jpg';

  const league1Id = 'leg-primera-01';
  const league2Id = 'leg-plata-02';

  const defaultUser: Profile = {
    id: 'usr-default-01',
    username: 'manager_nerva',
    display_name: 'Director Técnico Nerva',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    coins: 50000,
    role: 'user',
    premium_active: false,
    premium_expires_at: null,
    club_id: 'clb-titan-01',
    status: 'active',
    password_hash: '123456',
    created_at: new Date().toISOString()
  };

  const clubs: Club[] = [
    {
      id: 'clb-titan-01',
      owner_id: defaultUser.id,
      name: 'Titan FC',
      short_name: 'TIT',
      crest_url: crestTitan,
      banner_url: stadiumBanner,
      description: 'Club histórico fundado en la cima de la liga. Famoso por su fútbol veloz, alta presión y cantera implacable.',
      budget: 450000,
      valuation: 32500000,
      division_tier: 1,
      league_id: league1Id,
      formation: '4-3-3',
      matches_played: 14,
      matches_won: 10,
      matches_drawn: 2,
      matches_lost: 2,
      goals_for: 28,
      goals_against: 11,
      trophies_count: 3,
      reputation: 1250,
      fans: 45000,
      stadium_level: 2,
      stadium_name: 'Estadio Regional Titan',
      stadium_capacity: 14000,
      created_at: new Date().toISOString()
    },
    {
      id: 'clb-vanguard-02',
      owner_id: 'usr-rival-02',
      name: 'Vanguard CF',
      short_name: 'VAN',
      crest_url: crestVanguard,
      banner_url: stadiumBanner,
      description: 'El eterno rival con un estilo táctico defensivo impenetrable y contragolpes fulminantes.',
      budget: 380000,
      valuation: 29800000,
      division_tier: 1,
      league_id: league1Id,
      formation: '4-4-2',
      matches_played: 14,
      matches_won: 9,
      matches_drawn: 4,
      matches_lost: 1,
      goals_for: 24,
      goals_against: 9,
      trophies_count: 2,
      reputation: 1210,
      fans: 38000,
      stadium_level: 2,
      stadium_name: 'Estadio Vanguard',
      stadium_capacity: 14000,
      created_at: new Date().toISOString()
    },
    {
      id: 'clb-olympus-03',
      owner_id: 'usr-rival-03',
      name: 'Olympus Real',
      short_name: 'OLY',
      crest_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80',
      banner_url: stadiumBanner,
      description: 'Club de gran presupuesto con estrellas internacionales consagradas en su mediocampo.',
      budget: 620000,
      valuation: 34100000,
      division_tier: 1,
      league_id: league1Id,
      formation: '4-2-3-1',
      matches_played: 14,
      matches_won: 8,
      matches_drawn: 3,
      matches_lost: 3,
      goals_for: 26,
      goals_against: 14,
      trophies_count: 4,
      reputation: 1180,
      fans: 52000,
      stadium_level: 2,
      stadium_name: 'Olympus Arena',
      stadium_capacity: 14000,
      created_at: new Date().toISOString()
    },
    {
      id: 'clb-valkyria-04',
      owner_id: 'usr-rival-04',
      name: 'Valkyria Athletic',
      short_name: 'VAL',
      crest_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&auto=format&fit=crop&q=80',
      banner_url: stadiumBanner,
      description: 'Poder físico nórdico, especialistas en balones aéreos y juego asociativo.',
      budget: 250000,
      valuation: 22000000,
      division_tier: 1,
      league_id: league1Id,
      formation: '3-5-2',
      matches_played: 14,
      matches_won: 7,
      matches_drawn: 2,
      matches_lost: 5,
      goals_for: 20,
      goals_against: 17,
      trophies_count: 1,
      reputation: 1140,
      fans: 26000,
      stadium_level: 1,
      stadium_name: 'Graderío Valkyria',
      stadium_capacity: 6000,
      created_at: new Date().toISOString()
    }
  ];

  const leagues: League[] = [
    {
      id: league1Id,
      title: 'NERVA Premier League',
      logo_url: brandLogo,
      banner_url: stadiumBanner,
      description: 'La máxima categoría del fútbol competitivo de NERVA. Solo los mejores clubes alcanzan la gloria.',
      tier: 1,
      promotion_league_id: null,
      relegation_league_id: league2Id,
      clubs_count: 8,
      season: 'Temporada 2026/2027',
      created_at: new Date().toISOString()
    },
    {
      id: league2Id,
      title: 'NERVA Liga Plata',
      logo_url: brandLogo,
      banner_url: stadiumBanner,
      description: 'División de plata donde se forjan las futuras leyendas y se lucha ferozmente por el ascenso a Premier.',
      tier: 2,
      promotion_league_id: league1Id,
      relegation_league_id: null,
      clubs_count: 8,
      season: 'Temporada 2026/2027',
      created_at: new Date().toISOString()
    }
  ];

  const standings: Standing[] = [
    { id: 'std-1', league_id: league1Id, club_id: 'clb-titan-01', club_name: 'Titan FC', crest_url: crestTitan, played: 14, won: 10, drawn: 2, lost: 2, goals_for: 28, goals_against: 11, goal_diff: 17, points: 32 },
    { id: 'std-2', league_id: league1Id, club_id: 'clb-vanguard-02', club_name: 'Vanguard CF', crest_url: crestVanguard, played: 14, won: 9, drawn: 4, lost: 1, goals_for: 24, goals_against: 9, goal_diff: 15, points: 31 },
    { id: 'std-3', league_id: league1Id, club_id: 'clb-olympus-03', club_name: 'Olympus Real', crest_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80', played: 14, won: 8, drawn: 3, lost: 3, goals_for: 26, goals_against: 14, goal_diff: 12, points: 27 },
    { id: 'std-4', league_id: league1Id, club_id: 'clb-valkyria-04', club_name: 'Valkyria Athletic', crest_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&auto=format&fit=crop&q=80', played: 14, won: 7, drawn: 2, lost: 5, goals_for: 20, goals_against: 17, goal_diff: 3, points: 23 }
  ];

  const rawPlayersData = [
    // Titan FC Starters & Squad
    { id: 'ply-01', first_name: 'Mateo', last_name: 'Navarro', age: 26, nationality: 'España', position: 'POR' as const, rating: 86, potential: 89, price: 18500000, salary: 45000, club_id: 'clb-titan-01', club_name: 'Titan FC', stats: { pace: 78, shooting: 25, passing: 72, dribbling: 65, defense: 87, physical: 84 }, avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', is_starter: true },
    { id: 'ply-02', first_name: 'Lucas', last_name: 'Silva', age: 24, nationality: 'Brasil', position: 'LD' as const, rating: 84, potential: 88, price: 14200000, salary: 38000, club_id: 'clb-titan-01', club_name: 'Titan FC', stats: { pace: 89, shooting: 68, passing: 81, dribbling: 83, defense: 80, physical: 79 }, avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', is_starter: true },
    { id: 'ply-03', first_name: 'Dario', last_name: 'Benítez', age: 28, nationality: 'Argentina', position: 'DFC' as const, rating: 88, potential: 90, price: 24000000, salary: 55000, club_id: 'clb-titan-01', club_name: 'Titan FC', stats: { pace: 75, shooting: 40, passing: 74, dribbling: 68, defense: 89, physical: 91 }, avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', is_starter: true },
    { id: 'ply-04', first_name: 'Kilian', last_name: 'Moreau', age: 23, nationality: 'Francia', position: 'DFC' as const, rating: 83, potential: 89, price: 16500000, salary: 36000, club_id: 'clb-titan-01', club_name: 'Titan FC', stats: { pace: 80, shooting: 42, passing: 75, dribbling: 71, defense: 84, physical: 86 }, avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', is_starter: true },
    { id: 'ply-05', first_name: 'Theo', last_name: 'Hernández', age: 25, nationality: 'España', position: 'LI' as const, rating: 85, potential: 88, price: 17800000, salary: 42000, club_id: 'clb-titan-01', club_name: 'Titan FC', stats: { pace: 91, shooting: 71, passing: 79, dribbling: 82, defense: 81, physical: 83 }, avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', is_starter: true },
    { id: 'ply-06', first_name: 'Enzo', last_name: 'Valverde', age: 25, nationality: 'Uruguay', position: 'MCD' as const, rating: 87, potential: 91, price: 28500000, salary: 60000, club_id: 'clb-titan-01', club_name: 'Titan FC', stats: { pace: 82, shooting: 78, passing: 86, dribbling: 84, defense: 86, physical: 88 }, avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', is_starter: true },
    { id: 'ply-07', first_name: 'Adrián', last_name: 'Céspedes', age: 22, nationality: 'España', position: 'MC' as const, rating: 84, potential: 92, price: 21000000, salary: 40000, club_id: 'clb-titan-01', club_name: 'Titan FC', stats: { pace: 79, shooting: 80, passing: 89, dribbling: 87, defense: 74, physical: 76 }, avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', is_starter: true },
    { id: 'ply-08', first_name: 'Julian', last_name: 'Drax', age: 27, nationality: 'Alemania', position: 'MCO' as const, rating: 89, potential: 91, price: 33000000, salary: 72000, club_id: 'clb-titan-01', club_name: 'Titan FC', stats: { pace: 83, shooting: 88, passing: 92, dribbling: 90, defense: 62, physical: 78 }, avatar_url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80', is_starter: true },
    { id: 'ply-09', first_name: 'Rodrigo', last_name: 'Vinicius', age: 23, nationality: 'Brasil', position: 'ED' as const, rating: 88, potential: 93, price: 36000000, salary: 75000, club_id: 'clb-titan-01', club_name: 'Titan FC', stats: { pace: 95, shooting: 84, passing: 82, dribbling: 92, defense: 48, physical: 75 }, avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', is_starter: true },
    { id: 'ply-10', first_name: 'Samuel', last_name: 'Okonjo', age: 24, nationality: 'Nigeria', position: 'EI' as const, rating: 86, potential: 90, price: 26000000, salary: 52000, club_id: 'clb-titan-01', club_name: 'Titan FC', stats: { pace: 93, shooting: 83, passing: 79, dribbling: 89, defense: 45, physical: 80 }, avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', is_starter: true },
    { id: 'ply-11', first_name: 'Marcus', last_name: 'Sterling', age: 26, nationality: 'Inglaterra', position: 'DC' as const, rating: 90, potential: 92, price: 42000000, salary: 85000, club_id: 'clb-titan-01', club_name: 'Titan FC', stats: { pace: 88, shooting: 93, passing: 81, dribbling: 87, defense: 42, physical: 84 }, avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', is_starter: true },

    // Transfer Market Starters Available for Purchase
    { id: 'ply-12', first_name: 'Gabriel', last_name: 'Barrios', age: 21, nationality: 'Colombia', position: 'DC' as const, rating: 82, potential: 91, price: 1450000, salary: 28000, club_id: null, club_name: 'Agente Libre', stats: { pace: 90, shooting: 84, passing: 73, dribbling: 84, defense: 38, physical: 77 }, avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', is_starter: false },
    { id: 'ply-13', first_name: 'Hiroshi', last_name: 'Tanaka', age: 22, nationality: 'Japón', position: 'MC' as const, rating: 81, potential: 89, price: 1150000, salary: 24000, club_id: null, club_name: 'Agente Libre', stats: { pace: 81, shooting: 75, passing: 87, dribbling: 86, defense: 68, physical: 71 }, avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', is_starter: false },
    { id: 'ply-14', first_name: 'Lorenzo', last_name: 'Romano', age: 25, nationality: 'Italia', position: 'DFC' as const, rating: 85, potential: 87, price: 1950000, salary: 36000, club_id: null, club_name: 'Agente Libre', stats: { pace: 77, shooting: 38, passing: 76, dribbling: 70, defense: 87, physical: 88 }, avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', is_starter: false },
    { id: 'ply-15', first_name: 'Aleksandar', last_name: 'Petrov', age: 27, nationality: 'Serbia', position: 'MCD' as const, rating: 83, potential: 85, price: 1350000, salary: 30000, club_id: null, club_name: 'Agente Libre', stats: { pace: 74, shooting: 71, passing: 81, dribbling: 77, defense: 85, physical: 89 }, avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', is_starter: false },
    { id: 'ply-16', first_name: 'Yassine', last_name: 'Bennani', age: 20, nationality: 'Marruecos', position: 'ED' as const, rating: 80, potential: 92, price: 1200000, salary: 22000, club_id: null, club_name: 'Agente Libre', stats: { pace: 94, shooting: 79, passing: 76, dribbling: 88, defense: 44, physical: 72 }, avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', is_starter: false },
    { id: 'ply-17', first_name: 'Maxime', last_name: 'Lemoine', age: 28, nationality: 'Francia', position: 'POR' as const, rating: 84, potential: 85, price: 1400000, salary: 32000, club_id: null, club_name: 'Agente Libre', stats: { pace: 72, shooting: 20, passing: 70, dribbling: 61, defense: 86, physical: 82 }, avatar_url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80', is_starter: false }
  ];

  const players: Player[] = rawPlayersData.map(p => ({
    ...p,
    status: p.club_id === null ? 'listed' : 'active',
    form: 8,
    goals: p.position === 'DC' ? 14 : p.position === 'ED' || p.position === 'EI' ? 8 : 2,
    assists: p.position === 'MCO' || p.position === 'MC' ? 11 : 4,
    matches_played: 14,
    created_at: new Date().toISOString()
  }));

  const transfers: TransferListing[] = [
    {
      id: 'trs-01',
      player_id: 'ply-12',
      player: players.find(p => p.id === 'ply-12')!,
      seller_club_id: 'clb-vanguard-02',
      seller_club_name: 'Vanguard CF',
      asking_price: 1450000,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      status: 'active'
    },
    {
      id: 'trs-02',
      player_id: 'ply-13',
      player: players.find(p => p.id === 'ply-13')!,
      seller_club_id: 'clb-olympus-03',
      seller_club_name: 'Olympus Real',
      asking_price: 1150000,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      status: 'active'
    },
    {
      id: 'trs-03',
      player_id: 'ply-14',
      player: players.find(p => p.id === 'ply-14')!,
      seller_club_id: 'clb-valkyria-04',
      seller_club_name: 'Valkyria Athletic',
      asking_price: 1950000,
      created_at: new Date(Date.now() - 10800000).toISOString(),
      status: 'active'
    }
  ];

  // 1 Player in Live Auction
  const auctionPlayer = players.find(p => p.id === 'ply-16')!;
  auctionPlayer.status = 'auction';

  const auctions: Auction[] = [
    {
      id: 'auc-01',
      player_id: 'ply-16',
      player: auctionPlayer,
      starting_bid: 950000,
      current_bid: 1120000,
      highest_bidder_id: 'usr-rival-02',
      highest_bidder_club_name: 'Vanguard CF',
      starts_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      ends_at: new Date(Date.now() + 3600000 * 20).toISOString(), // Ends in 20 hours
      status: 'active'
    }
  ];

  const matches: Match[] = [
    {
      id: 'mch-next-01',
      league_id: league1Id,
      matchday: 15,
      home_club_id: 'clb-titan-01',
      away_club_id: 'clb-vanguard-02',
      home_club_name: 'Titan FC',
      away_club_name: 'Vanguard CF',
      home_crest: crestTitan,
      away_crest: crestVanguard,
      home_score: null,
      away_score: null,
      status: 'scheduled',
      events: [],
      played_at: new Date(Date.now() + 86400000).toISOString()
    },
    {
      id: 'mch-past-01',
      league_id: league1Id,
      matchday: 14,
      home_club_id: 'clb-olympus-03',
      away_club_id: 'clb-titan-01',
      home_club_name: 'Olympus Real',
      away_club_name: 'Titan FC',
      home_crest: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80',
      away_crest: crestTitan,
      home_score: 1,
      away_score: 3,
      status: 'finished',
      events: ['14\' Gol de Marcus Sterling', '41\' Gol de Julian Drax', '68\' Gol de Olympus', '88\' Gol de Samuel Okonjo'],
      played_at: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ];

  const trophies: Trophy[] = [
    {
      id: 'trp-01',
      title: 'Copa de Campeones NERVA',
      image_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&auto=format&fit=crop&q=80',
      description: 'Trofeo otorgado al vencedor absoluto de la temporada.',
      league_id: league1Id,
      season: '2025/2026',
      condition: 'Campeón invicto de la fase eliminatoria.',
      club_id: 'clb-titan-01',
      unlocked_at: new Date(Date.now() - 86400000 * 30).toISOString()
    },
    {
      id: 'trp-02',
      title: 'Supercopa Élite',
      image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80',
      description: 'Duelo de titanes entre los dos campeones del circuito.',
      league_id: league1Id,
      season: '2025/2026',
      condition: 'Ganador de la Supercopa de Verano.',
      club_id: 'clb-titan-01',
      unlocked_at: new Date(Date.now() - 86400000 * 60).toISOString()
    }
  ];

  const achievements: Achievement[] = [
    { id: 'ach-01', code: 'FIRST_MATCH', title: 'Bautismo de Fuego', description: 'Disputa tu primer partido como entrenador en NERVA.', icon: 'trophy', category: 'matches', reward_coins: 25000, unlocked: true, unlocked_at: new Date().toISOString() },
    { id: 'ach-02', code: 'FIRST_WIN', title: 'Sabor a Victoria', description: 'Consigue tu primera victoria oficial en liga.', icon: 'flame', category: 'matches', reward_coins: 40000, unlocked: true, unlocked_at: new Date().toISOString() },
    { id: 'ach-03', code: 'FIRST_SIGNING', title: 'Negociador Nato', description: 'Completa tu primer fichaje en el mercado de transferencias.', icon: 'users', category: 'transfers', reward_coins: 50000, unlocked: true, unlocked_at: new Date().toISOString() },
    { id: 'ach-04', code: '10_WINS', title: 'Racha Implacable', description: 'Alcanza 10 victorias oficiales en una misma temporada.', icon: 'zap', category: 'matches', reward_coins: 100000, unlocked: true, unlocked_at: new Date().toISOString() },
    { id: 'ach-05', code: 'FIRST_TROPHY', title: 'En la Gloria', description: 'Levanta un trofeo oficial para las vitrinas de tu club.', icon: 'award', category: 'club', reward_coins: 150000, unlocked: true, unlocked_at: new Date().toISOString() },
    { id: 'ach-06', code: '1M_VALUATION', title: 'Club Galáctico', description: 'Supera los 25.000.000 de valoración de plantilla.', icon: 'shield', category: 'economy', reward_coins: 200000, unlocked: true, unlocked_at: new Date().toISOString() }
  ];

  const cosmetics: CosmeticItem[] = [
    { id: 'cos-banner-stadium', name: 'Estadio Nocturno Floodlight', image_url: stadiumBanner, type: 'banner', is_premium: false, description: 'Banner de estadio bajo los focos de medianoche.', obtained: true },
    { id: 'cos-banner-gold', name: 'Aura Dorada VIP', image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80', type: 'banner', is_premium: true, description: 'Elegante textura dorada de campeones.', obtained: true },
    { id: 'cos-crest-titan', name: 'Escudo Titan Obsidian', image_url: crestTitan, type: 'logo', is_premium: false, description: 'Escudo insignia de Titan FC.', obtained: true },
    { id: 'cos-badge-founder', name: 'Insignia Fundador', image_url: brandLogo, type: 'badge', is_premium: false, description: 'Emblema reservado a los pioneros de NERVA.', obtained: true }
  ];

  const rewardCodes: RewardCode[] = [
    {
      id: 'rc-devs',
      code: 'DEVS',
      reward_type: 'coins',
      reward_value: 400000,
      max_uses: 100000,
      uses_count: 0,
      expires_at: null,
      is_active: true
    },
    {
      id: 'rc-nerva2026',
      code: 'NERVA2026',
      reward_type: 'coins',
      reward_value: 250000,
      max_uses: 100000,
      uses_count: 0,
      expires_at: null,
      is_active: true
    }
  ];

  const premiumCodes = [
    {
      id: 'prem-vip7',
      code: 'NERVAVIP7',
      duration_days: 7,
      max_uses: 1,
      uses_count: 0,
      is_active: true
    },
    {
      id: 'prem-pro7',
      code: 'PROMANAGER7',
      duration_days: 7,
      max_uses: 1,
      uses_count: 0,
      is_active: true
    }
  ];

  const appSettings: AppSettings = {
    app_name: 'NERVA Football Manager',
    favicon_url: '/icon.svg',
    logo_url: brandLogo,
    maintenance_mode: false,
    registration_open: true
  };

  const sponsors: Sponsor[] = [
    {
      id: 'spn-01',
      name: 'AeroFly Global',
      category: 'Aerolíneas & Aviación',
      icon_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=120&auto=format&fit=crop&q=80',
      payout_per_match: 65000,
      match_bonus: 65000,
      signing_bonus: 250000,
      requirement_tier: 1,
      contract_duration_matches: 10,
      description: 'Patrocinador principal de vuelos chárter y equipamiento de alta gama.'
    },
    {
      id: 'spn-02',
      name: 'Titan Energy Drink',
      category: 'Bebidas Deportivas',
      icon_url: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=120&auto=format&fit=crop&q=80',
      payout_per_match: 45000,
      match_bonus: 45000,
      signing_bonus: 180000,
      requirement_tier: 1,
      contract_duration_matches: 8,
      description: 'Nutrición y suplementación para máxima resistencia en el campo.'
    },
    {
      id: 'spn-03',
      name: 'Apex Telecom',
      category: 'Telecomunicaciones & 5G',
      icon_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80',
      payout_per_match: 30000,
      match_bonus: 30000,
      signing_bonus: 120000,
      requirement_tier: 2,
      contract_duration_matches: 6,
      description: 'Conectividad oficial para transmisiones en streaming y analítica.'
    }
  ];

  return {
    profiles: [defaultUser],
    clubs: clubs.map(c => ({
      ...c,
      primary_kit_color: '#10b981',
      secondary_kit_color: '#0f172a',
      kit_pattern: 'stripes' as const,
      active_sponsor_id: 'spn-01'
    })),
    players,
    leagues,
    standings,
    matches,
    transfers,
    transfer_offers: [],
    auctions,
    auction_bids: [],
    trophies,
    sponsors,
    achievements,
    user_achievements: achievements.map(a => ({ user_id: defaultUser.id, achievement_id: a.id, unlocked_at: new Date().toISOString() })),
    cosmetics,
    user_cosmetics: cosmetics.map(c => ({ user_id: defaultUser.id, cosmetic_id: c.id, obtained_at: new Date().toISOString() })),
    reward_codes: rewardCodes,
    reward_code_uses: [],
    premium_codes: premiumCodes,
    premium_code_uses: [],
    sponsor_offers: [],
    club_posts: [
      {
        id: 'pst-01',
        club_id: 'clb-titan-01',
        club_name: 'Titan FC',
        club_crest: crestTitan,
        type: 'statement',
        title: '¡Comienza la temporada oficial de NERVA!',
        content: 'La directiva y el cuerpo técnico saludan a la afición. ¡Esta temporada vamos por el título de liga y la gloria deportiva!',
        image_url: stadiumBanner,
        likes: 1420,
        created_at: new Date().toISOString()
      }
    ],
    notifications: [
      {
        id: 'notif-01',
        user_id: defaultUser.id,
        club_id: 'clb-titan-01',
        title: '¡Bienvenido a la temporada oficial!',
        message: 'Revisa tus partidos programados para hoy en los turnos oficiales: 3:00, 8:00 y 11:00.',
        type: 'match_alert',
        read: false,
        created_at: new Date().toISOString()
      }
    ],
    background_tracks: [
      {
        id: 'trk-01',
        title: 'Nerva Champions Theme (Electric Stadium)',
        artist: 'Nerva Sound Lab',
        url: 'https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3',
        is_active: true
      }
    ],
    coin_transactions: [
      {
        id: 'tx-welcome-01',
        user_id: defaultUser.id,
        amount: 450000,
        type: 'reward_code',
        description: 'Bono inicial de bienvenida NERVA Pro',
        created_at: new Date().toISOString()
      }
    ],
    admin_actions: [],
    app_settings: appSettings
  };
}

class DatabaseManager {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(content);
        if (!parsed.sponsor_offers) parsed.sponsor_offers = [];
        if (!parsed.club_posts) parsed.club_posts = [];
        if (!parsed.notifications) parsed.notifications = [];
        if (!parsed.background_tracks || parsed.background_tracks.length === 0) {
          parsed.background_tracks = [
            {
              id: 'trk-01',
              title: 'Nerva Champions Theme (Electric Stadium)',
              artist: 'Nerva Sound Lab',
              url: 'https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3',
              is_active: true
            }
          ];
        }
        parsed.clubs.forEach(c => {
          if (c.reputation === undefined) c.reputation = 1250;
          if (c.fans === undefined) c.fans = 250000;
          if (c.stadium_level === undefined) c.stadium_level = 1;
          if (!c.stadium_name) c.stadium_name = `${c.name} Arena`;
          if (!c.stadium_capacity) c.stadium_capacity = 6000;
          if (!c.active_sponsor_ids) c.active_sponsor_ids = c.active_sponsor_id ? [c.active_sponsor_id] : [];
        });
        return parsed;
      }
    } catch (err) {
      console.error('Error reading database file, using defaults:', err);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  public save() {
    this.saveData(this.db);
  }

  private saveData(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public get data(): DatabaseSchema {
    return this.db;
  }
}

export const dbManager = new DatabaseManager();
export const db = dbManager.data;
