import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { dbManager, db } from './src/server/db.ts';
import { Club, Player, UserRole, Standing, Match, Sponsor, Trophy } from './src/types/index.ts';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

const uploadsPath = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Helper to get authorization session / current profile
function getSessionUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Default to the primary user if in demo mode or single user session
    return db.profiles[0];
  }
  const token = authHeader.replace('Bearer ', '');
  const user = db.profiles.find(p => p.id === token || p.username === token);
  return user || db.profiles[0];
}

// -------------------------------------------------------------
// 1. AUTH & PROFILE ENDPOINTS
// -------------------------------------------------------------
app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader === 'Bearer null' || authHeader === 'Bearer undefined') {
    return res.status(401).json({ error: 'No autenticado' });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const user = db.profiles.find(p => p.id === token || p.username === token);
  if (!user) {
    return res.status(401).json({ error: 'Sesión no encontrada' });
  }

  // Check if premium expired
  if (user.premium_active && user.premium_expires_at) {
    if (new Date(user.premium_expires_at).getTime() < Date.now()) {
      user.premium_active = false;
      dbManager.save();
    }
  }

  const club = db.clubs.find(c => c.id === user.club_id) || null;
  res.json({ user, club });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, display_name, club_name } = req.body;
  if (!username || !display_name) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const existing = db.profiles.find(p => p.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
  }

  const newUserId = `usr-${Date.now()}`;
  const newClubId = `clb-${Date.now()}`;

  const newClub: Club = {
    id: newClubId,
    owner_id: newUserId,
    name: club_name || `${display_name} FC`,
    short_name: (club_name || display_name).substring(0, 3).toUpperCase(),
    crest_url: '/src/assets/images/crest_titan_fc_1790393819091.jpg',
    banner_url: '/src/assets/images/stadium_banner_pitch_1790393808701.jpg',
    description: 'Club recién ascendido a la competición de NERVA.',
    budget: 350000,
    valuation: 15000000,
    division_tier: 1,
    league_id: db.leagues[0].id,
    formation: '4-3-3',
    matches_played: 0,
    matches_won: 0,
    matches_drawn: 0,
    matches_lost: 0,
    goals_for: 0,
    goals_against: 0,
    trophies_count: 0,
    created_at: new Date().toISOString()
  };

  const newUser = {
    id: newUserId,
    username,
    display_name,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    coins: 350000,
    role: 'user' as UserRole,
    premium_active: false,
    premium_expires_at: null,
    club_id: newClubId,
    status: 'active' as const,
    created_at: new Date().toISOString()
  };

  db.profiles.push(newUser);
  db.clubs.push(newClub);

  // Assign starter players to this new club from free pool or create 11 standard players
  const availableFreePlayers = db.players.filter(p => p.club_id === null).slice(0, 6);
  availableFreePlayers.forEach(p => {
    p.club_id = newClubId;
    p.club_name = newClub.name;
    p.status = 'active';
  });

  // Record initial welcome bonus
  db.coin_transactions.push({
    id: `tx-${Date.now()}`,
    user_id: newUserId,
    amount: 350000,
    type: 'reward_code',
    description: 'Presupuesto inicial de fundación del Club',
    created_at: new Date().toISOString()
  });

  dbManager.save();
  res.json({ user: newUser, club: newClub, token: newUser.id });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username } = req.body;
  const user = db.profiles.find(p => p.username.toLowerCase() === (username || '').toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  const club = db.clubs.find(c => c.id === user.club_id) || null;
  res.json({ user, club, token: user.id });
});

app.post('/api/upload', (req: Request, res: Response) => {
  try {
    const { dataUrl, filename } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ error: 'No se envió imagen' });
    }

    // Direct url fallback
    if (typeof dataUrl === 'string' && (dataUrl.startsWith('http://') || dataUrl.startsWith('https://') || dataUrl.startsWith('/src/'))) {
      return res.json({ url: dataUrl });
    }

    const matches = String(dataUrl).match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Formato de imagen inválido (se esperaba Base64)' });
    }

    const mime = matches[1];
    const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : mime.includes('svg') ? 'svg' : 'jpg';
    const safeName = `img-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
    const filePath = path.join(uploadsPath, safeName);
    const buffer = Buffer.from(matches[2], 'base64');
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;
    res.json({ url: publicUrl, success: true });
  } catch (err: any) {
    console.error('Error handling upload:', err);
    res.status(500).json({ error: 'Error al guardar la imagen en el servidor' });
  }
});

app.put('/api/auth/profile', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const { display_name, avatar_url, theme_color, bio, nationality, tactical_style } = req.body;
  if (display_name) user.display_name = display_name;
  if (avatar_url) user.avatar_url = avatar_url;
  if (bio !== undefined) user.bio = bio;
  if (nationality !== undefined) user.nationality = nationality;
  if (tactical_style !== undefined) user.tactical_style = tactical_style;

  if (theme_color) {
    if (!user.premium_active && user.role === 'user') {
      return res.status(403).json({ error: 'El color de acento personalizado requiere suscripción Premium' });
    }
    user.theme_color = theme_color;
  }
  dbManager.save();
  res.json({ user });
});

// -------------------------------------------------------------
// 2. CLUBS & SQUAD MANAGEMENT
// -------------------------------------------------------------
app.get('/api/clubs/my', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const club = db.clubs.find(c => c.id === user.club_id);
  if (!club) return res.status(404).json({ error: 'Club no encontrado' });
  const squad = db.players.filter(p => p.club_id === club.id);
  const sponsor = db.sponsors?.find(s => s.id === club.active_sponsor_id) || null;
  res.json({ club, squad, sponsor });
});

app.put('/api/clubs/my', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const club = db.clubs.find(c => c.id === user.club_id);
  if (!club) return res.status(404).json({ error: 'Club no encontrado' });

  const { 
    name, description, formation, crest_url, banner_url,
    primary_kit_color, secondary_kit_color, kit_pattern, active_sponsor_id 
  } = req.body;

  // Basic editing
  if (name && name.trim()) {
    club.name = name.trim();
    club.short_name = name.trim().substring(0, 3).toUpperCase();
  }
  if (description !== undefined) club.description = description;
  if (formation) club.formation = formation;

  // Kit customization (Edición avanzada de camisetas)
  if (primary_kit_color) club.primary_kit_color = primary_kit_color;
  if (secondary_kit_color) club.secondary_kit_color = secondary_kit_color;
  if (kit_pattern) club.kit_pattern = kit_pattern;
  if (active_sponsor_id !== undefined) club.active_sponsor_id = active_sponsor_id;

  // Advanced editing (crest, banner) requires Premium or Owner/Admin
  if (crest_url || banner_url) {
    if (!user.premium_active && user.role === 'user') {
      return res.status(403).json({ error: 'La personalización avanzada de escudo y banner requiere suscripción Premium' });
    }
    if (crest_url) club.crest_url = crest_url;
    if (banner_url) club.banner_url = banner_url;
  }

  dbManager.save();
  res.json({ club });
});

// Sponsors endpoints
app.get('/api/sponsors', (_req: Request, res: Response) => {
  res.json({ sponsors: db.sponsors || [] });
});

app.post('/api/clubs/sign-sponsor', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const club = db.clubs.find(c => c.id === user.club_id);
  if (!club) return res.status(404).json({ error: 'Club no encontrado' });

  const { sponsor_id } = req.body;
  const sponsor = db.sponsors.find(s => s.id === sponsor_id);
  if (!sponsor) return res.status(404).json({ error: 'Sponsor no encontrado' });

  if (club.division_tier < sponsor.requirement_tier) {
    return res.status(400).json({ error: `Tu club necesita estar en División ${sponsor.requirement_tier} para este patrocinio` });
  }

  club.active_sponsor_id = sponsor.id;
  user.coins += sponsor.signing_bonus;
  club.budget += sponsor.signing_bonus;

  db.coin_transactions.unshift({
    id: `tx-${Date.now()}`,
    user_id: user.id,
    amount: sponsor.signing_bonus,
    type: 'reward_code',
    description: `Bono de firma con patrocinador oficial: ${sponsor.name}`,
    created_at: new Date().toISOString()
  });

  dbManager.save();
  res.json({ success: true, club, sponsor, coins: user.coins });
});

// -------------------------------------------------------------
// 3. PLAYERS & SQUAD
// -------------------------------------------------------------
app.get('/api/players', (req: Request, res: Response) => {
  const { position, club_id, minRating, maxPrice, search } = req.query;
  let result = [...db.players];

  if (position) {
    result = result.filter(p => p.position === position);
  }
  if (club_id) {
    result = result.filter(p => p.club_id === club_id);
  }
  if (minRating) {
    result = result.filter(p => p.rating >= Number(minRating));
  }
  if (maxPrice) {
    result = result.filter(p => p.price <= Number(maxPrice));
  }
  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(p => 
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      p.nationality.toLowerCase().includes(q)
    );
  }

  res.json({ players: result });
});

app.put('/api/players/:id/lineup', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const { is_starter } = req.body;
  const player = db.players.find(p => p.id === req.params.id);
  if (!player) return res.status(404).json({ error: 'Jugador no encontrado' });
  if (player.club_id !== user.club_id) return res.status(403).json({ error: 'El jugador no pertenece a tu club' });

  player.is_starter = Boolean(is_starter);
  dbManager.save();
  res.json({ player });
});

// -------------------------------------------------------------
// 4. TRANSFER MARKET & DEALS
// -------------------------------------------------------------
app.get('/api/market/listings', (_req: Request, res: Response) => {
  // Return listings with updated player info
  const listings = db.transfers
    .filter(t => t.status === 'active')
    .map(t => {
      const player = db.players.find(p => p.id === t.player_id);
      return { ...t, player: player || t.player };
    });
  res.json({ listings });
});

app.post('/api/market/list-player', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const { player_id, asking_price } = req.body;
  const price = Number(asking_price);

  if (!price || price <= 0) return res.status(400).json({ error: 'Precio no válido' });
  const player = db.players.find(p => p.id === player_id);
  if (!player) return res.status(404).json({ error: 'Jugador no encontrado' });
  if (player.club_id !== user.club_id) return res.status(403).json({ error: 'El jugador no pertenece a tu club' });

  player.status = 'listed';
  const listing: any = {
    id: `trs-${Date.now()}`,
    player_id: player.id,
    player,
    seller_club_id: user.club_id!,
    seller_club_name: db.clubs.find(c => c.id === user.club_id)?.name || 'Club Propietario',
    asking_price: price,
    created_at: new Date().toISOString(),
    status: 'active'
  };

  db.transfers.unshift(listing);
  dbManager.save();
  res.json({ listing });
});

app.post('/api/market/buy', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const { listing_id } = req.body;
  const listing = db.transfers.find(t => t.id === listing_id && t.status === 'active');
  if (!listing) return res.status(404).json({ error: 'Fichaje no disponible o ya vendido' });

  const buyerClub = db.clubs.find(c => c.id === user.club_id);
  if (!buyerClub) return res.status(400).json({ error: 'No tienes un club activo' });

  if (listing.seller_club_id === buyerClub.id) {
    return res.status(400).json({ error: 'No puedes comprar tu propio jugador' });
  }

  const cost = listing.asking_price;
  if (user.coins < cost) {
    return res.status(400).json({ error: `Saldo insuficiente. Necesitas ${cost.toLocaleString()} monedas y tienes ${user.coins.toLocaleString()}` });
  }

  const player = db.players.find(p => p.id === listing.player_id);
  if (!player) return res.status(404).json({ error: 'Jugador no encontrado' });

  // Deduct coins from buyer
  user.coins -= cost;
  buyerClub.budget -= cost;
  buyerClub.valuation += Math.round(cost * 0.9);

  // Credit coins to seller if real user club
  const sellerClub = db.clubs.find(c => c.id === listing.seller_club_id);
  if (sellerClub) {
    sellerClub.budget += cost;
    sellerClub.valuation = Math.max(0, sellerClub.valuation - Math.round(cost * 0.9));
    const sellerUser = db.profiles.find(p => p.id === sellerClub.owner_id);
    if (sellerUser) sellerUser.coins += cost;
  }

  // Transfer ownership
  player.club_id = buyerClub.id;
  player.club_name = buyerClub.name;
  player.status = 'active';
  player.is_starter = false;
  listing.status = 'sold';

  // Record transactions
  db.coin_transactions.unshift({
    id: `tx-${Date.now()}`,
    user_id: user.id,
    amount: -cost,
    type: 'transfer_buy',
    description: `Fichaje de ${player.first_name} ${player.last_name}`,
    reference_id: player.id,
    created_at: new Date().toISOString()
  });

  // Check achievements (e.g. FIRST_SIGNING)
  const firstSigningAch = db.achievements.find(a => a.code === 'FIRST_SIGNING');
  if (firstSigningAch && !db.user_achievements.some(ua => ua.user_id === user.id && ua.achievement_id === firstSigningAch.id)) {
    db.user_achievements.push({
      user_id: user.id,
      achievement_id: firstSigningAch.id,
      unlocked_at: new Date().toISOString()
    });
    user.coins += firstSigningAch.reward_coins;
  }

  dbManager.save();
  res.json({ success: true, player, coins: user.coins });
});

// -------------------------------------------------------------
// 5. AUCTIONS
// -------------------------------------------------------------
app.get('/api/auctions', (_req: Request, res: Response) => {
  // Settle any expired auctions automatically
  const now = Date.now();
  db.auctions.forEach(a => {
    if (a.status === 'active' && new Date(a.ends_at).getTime() <= now) {
      a.status = 'completed';
      if (a.highest_bidder_id) {
        const winningUser = db.profiles.find(p => p.id === a.highest_bidder_id);
        const player = db.players.find(p => p.id === a.player_id);
        if (winningUser && player && winningUser.club_id) {
          player.club_id = winningUser.club_id;
          player.club_name = db.clubs.find(c => c.id === winningUser.club_id)?.name;
          player.status = 'active';
        }
      }
    }
  });

  const auctions = db.auctions.map(a => {
    const player = db.players.find(p => p.id === a.player_id);
    return { ...a, player: player || a.player };
  });
  res.json({ auctions });
});

app.post('/api/auctions/bid', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const { auction_id, bid_amount } = req.body;
  const amount = Number(bid_amount);

  const auction = db.auctions.find(a => a.id === auction_id);
  if (!auction || auction.status !== 'active') {
    return res.status(400).json({ error: 'Subasta no disponible o finalizada' });
  }

  if (new Date(auction.ends_at).getTime() <= Date.now()) {
    auction.status = 'completed';
    dbManager.save();
    return res.status(400).json({ error: 'El tiempo límite de la subasta ha expirado' });
  }

  if (amount <= auction.current_bid) {
    return res.status(400).json({ error: `La puja debe ser superior a ${auction.current_bid.toLocaleString()} monedas` });
  }

  if (user.coins < amount) {
    return res.status(400).json({ error: 'No dispones de suficientes monedas para realizar esta puja' });
  }

  // Refund previous highest bidder
  if (auction.highest_bidder_id && auction.highest_bidder_id !== user.id) {
    const prevBidder = db.profiles.find(p => p.id === auction.highest_bidder_id);
    if (prevBidder) {
      prevBidder.coins += auction.current_bid;
      db.coin_transactions.unshift({
        id: `tx-${Date.now()}`,
        user_id: prevBidder.id,
        amount: auction.current_bid,
        type: 'auction_refund',
        description: `Reembolso por puja superada en subasta de ${auction.player.first_name} ${auction.player.last_name}`,
        created_at: new Date().toISOString()
      });
    }
  }

  // Deduct from current bidder
  user.coins -= amount;
  auction.current_bid = amount;
  auction.highest_bidder_id = user.id;
  const userClub = db.clubs.find(c => c.id === user.club_id);
  auction.highest_bidder_club_name = userClub ? userClub.name : user.display_name;

  db.auction_bids.unshift({
    id: `bid-${Date.now()}`,
    auction_id: auction.id,
    bidder_id: user.id,
    bidder_club_name: auction.highest_bidder_club_name,
    amount,
    created_at: new Date().toISOString()
  });

  db.coin_transactions.unshift({
    id: `tx-${Date.now()}`,
    user_id: user.id,
    amount: -amount,
    type: 'auction_bid',
    description: `Puja en subasta por ${auction.player.first_name} ${auction.player.last_name}`,
    created_at: new Date().toISOString()
  });

  dbManager.save();
  res.json({ success: true, auction, userCoins: user.coins });
});

// -------------------------------------------------------------
// 6. LEAGUES, STANDINGS & MATCH SIMULATION
// -------------------------------------------------------------
app.get('/api/leagues', (_req: Request, res: Response) => {
  res.json({ leagues: db.leagues });
});

app.get('/api/leagues/:id/standings', (req: Request, res: Response) => {
  const standings = db.standings
    .filter(s => s.league_id === req.params.id)
    .sort((a, b) => b.points - a.points || b.goal_diff - a.goal_diff || b.goals_for - a.goals_for);
  res.json({ standings });
});

app.get('/api/leagues/:id/matches', (req: Request, res: Response) => {
  const matches = db.matches
    .filter(m => m.league_id === req.params.id)
    .sort((a, b) => b.matchday - a.matchday);
  res.json({ matches });
});

// Server-Authoritative Match Simulation
app.post('/api/matches/simulate', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const userClub = db.clubs.find(c => c.id === user.club_id);
  if (!userClub) return res.status(400).json({ error: 'Club no encontrado' });

  // Find next scheduled match for user club or simulate league round
  let nextMatch = db.matches.find(m => 
    (m.home_club_id === userClub.id || m.away_club_id === userClub.id) && m.status === 'scheduled'
  );

  // If no scheduled match, generate a fresh match against a league rival
  if (!nextMatch) {
    const rivals = db.clubs.filter(c => c.id !== userClub.id);
    const opponent = rivals[Math.floor(Math.random() * rivals.length)] || rivals[0];
    const isHome = Math.random() > 0.5;

    nextMatch = {
      id: `mch-${Date.now()}`,
      league_id: userClub.league_id || db.leagues[0].id,
      matchday: userClub.matches_played + 1,
      home_club_id: isHome ? userClub.id : opponent.id,
      away_club_id: isHome ? opponent.id : userClub.id,
      home_club_name: isHome ? userClub.name : opponent.name,
      away_club_name: isHome ? opponent.name : userClub.name,
      home_crest: isHome ? userClub.crest_url : opponent.crest_url,
      away_crest: isHome ? opponent.crest_url : userClub.crest_url,
      home_score: null,
      away_score: null,
      status: 'scheduled',
      events: [],
      played_at: new Date().toISOString()
    };
    db.matches.unshift(nextMatch);
  }

  // Calculate team strengths
  const homeSquad = db.players.filter(p => p.club_id === nextMatch!.home_club_id && p.is_starter);
  const awaySquad = db.players.filter(p => p.club_id === nextMatch!.away_club_id && p.is_starter);

  const homeAvg = homeSquad.length ? homeSquad.reduce((acc, p) => acc + p.rating, 0) / homeSquad.length : 82;
  const awayAvg = awaySquad.length ? awaySquad.reduce((acc, p) => acc + p.rating, 0) / awaySquad.length : 82;

  // Home advantage (+3) & Controlled randomness
  const homePower = homeAvg + 3 + (Math.random() * 8 - 4);
  const awayPower = awayAvg + (Math.random() * 8 - 4);

  let homeScore = 0;
  let awayScore = 0;

  if (homePower > awayPower + 5) {
    homeScore = Math.floor(Math.random() * 3) + 2; // 2-4
    awayScore = Math.floor(Math.random() * 2);     // 0-1
  } else if (awayPower > homePower + 5) {
    homeScore = Math.floor(Math.random() * 2);
    awayScore = Math.floor(Math.random() * 3) + 2;
  } else {
    // Close match
    const diff = Math.random();
    if (diff < 0.35) {
      homeScore = 1 + Math.floor(Math.random() * 2);
      awayScore = homeScore; // Draw
    } else if (diff < 0.7) {
      homeScore = 2 + Math.floor(Math.random() * 2);
      awayScore = homeScore - 1;
    } else {
      awayScore = 2 + Math.floor(Math.random() * 2);
      homeScore = awayScore - 1;
    }
  }

  nextMatch.home_score = homeScore;
  nextMatch.away_score = awayScore;
  nextMatch.status = 'finished';
  nextMatch.events = [
    `12' Inicio intenso con posesión disputada`,
    `28' ¡Gol! ${homeScore > 0 ? nextMatch.home_club_name : nextMatch.away_club_name} inaugura el marcador`,
    `64' Remate al poste tras jugada colectiva`,
    `85' Silbatazo final en el coliseo deportivo`
  ];

  // Update Club records
  const homeClub = db.clubs.find(c => c.id === nextMatch!.home_club_id);
  const awayClub = db.clubs.find(c => c.id === nextMatch!.away_club_id);

  if (homeClub) {
    homeClub.matches_played += 1;
    homeClub.goals_for += homeScore;
    homeClub.goals_against += awayScore;
  }
  if (awayClub) {
    awayClub.matches_played += 1;
    awayClub.goals_for += awayScore;
    awayClub.goals_against += homeScore;
  }

  let winnerId: string | null = null;
  if (homeScore > awayScore) {
    winnerId = nextMatch.home_club_id;
    if (homeClub) homeClub.matches_won += 1;
    if (awayClub) awayClub.matches_lost += 1;
  } else if (awayScore > homeScore) {
    winnerId = nextMatch.away_club_id;
    if (awayClub) awayClub.matches_won += 1;
    if (homeClub) homeClub.matches_lost += 1;
  } else {
    if (homeClub) homeClub.matches_drawn += 1;
    if (awayClub) awayClub.matches_drawn += 1;
  }

  // Update Standings table
  const updateStanding = (clubId: string, gf: number, ga: number, won: boolean, drawn: boolean) => {
    let s = db.standings.find(item => item.club_id === clubId && item.league_id === nextMatch!.league_id);
    if (!s) {
      const c = db.clubs.find(item => item.id === clubId);
      s = {
        id: `std-${Date.now()}-${clubId}`,
        league_id: nextMatch!.league_id,
        club_id: clubId,
        club_name: c?.name || 'Club',
        crest_url: c?.crest_url || '',
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        goal_diff: 0,
        points: 0
      };
      db.standings.push(s);
    }
    s.played += 1;
    s.goals_for += gf;
    s.goals_against += ga;
    s.goal_diff = s.goals_for - s.goals_against;
    if (won) {
      s.won += 1;
      s.points += 3;
    } else if (drawn) {
      s.drawn += 1;
      s.points += 1;
    } else {
      s.lost += 1;
    }
  };

  updateStanding(nextMatch.home_club_id, homeScore, awayScore, homeScore > awayScore, homeScore === awayScore);
  updateStanding(nextMatch.away_club_id, awayScore, homeScore, awayScore > homeScore, homeScore === awayScore);

  // Rewards for User
  let rewardCoins = 15000; // participation
  if (winnerId === userClub.id) {
    rewardCoins = 65000; // victory
  } else if (homeScore === awayScore) {
    rewardCoins = 30000; // draw
  }

  // Sponsor match bonus
  let sponsorBonus = 0;
  if (userClub.active_sponsor_id && db.sponsors) {
    const activeSpn = db.sponsors.find(s => s.id === userClub.active_sponsor_id);
    if (activeSpn) {
      sponsorBonus = activeSpn.match_bonus || 25000;
      rewardCoins += sponsorBonus;
    }
  }

  user.coins += rewardCoins;

  db.coin_transactions.unshift({
    id: `tx-${Date.now()}`,
    user_id: user.id,
    amount: rewardCoins,
    type: 'match_bonus',
    description: `Recompensa Jornada ${nextMatch.matchday} vs ${nextMatch.home_club_id === userClub.id ? nextMatch.away_club_name : nextMatch.home_club_name}${sponsorBonus > 0 ? ' (incluye bono sponsor)' : ''}`,
    created_at: new Date().toISOString()
  });

  // Check achievements
  const firstMatchAch = db.achievements.find(a => a.code === 'FIRST_MATCH');
  if (firstMatchAch && !db.user_achievements.some(ua => ua.user_id === user.id && ua.achievement_id === firstMatchAch.id)) {
    db.user_achievements.push({ user_id: user.id, achievement_id: firstMatchAch.id, unlocked_at: new Date().toISOString() });
    user.coins += firstMatchAch.reward_coins;
  }
  if (winnerId === userClub.id) {
    const firstWinAch = db.achievements.find(a => a.code === 'FIRST_WIN');
    if (firstWinAch && !db.user_achievements.some(ua => ua.user_id === user.id && ua.achievement_id === firstWinAch.id)) {
      db.user_achievements.push({ user_id: user.id, achievement_id: firstWinAch.id, unlocked_at: new Date().toISOString() });
      user.coins += firstWinAch.reward_coins;
    }
  }

  dbManager.save();
  res.json({ match: nextMatch, rewardCoins, userCoins: user.coins, userClub });
});

// Automated Daily League Matches (2 matches per user per day)
app.get('/api/matches/daily', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const userClub = db.clubs.find(c => c.id === user.club_id);
  if (!userClub) return res.status(400).json({ error: 'Club no encontrado' });

  const now = Date.now();
  const rivals = db.clubs.filter(c => c.id !== userClub.id);

  // Look for existing daily matches for this user club
  let dailyMatches = db.matches.filter(m => 
    m.is_daily && (m.home_club_id === userClub.id || m.away_club_id === userClub.id)
  );

  // If not generated yet, generate the 2 daily matches
  if (dailyMatches.length === 0) {
    const opp1 = rivals[0] || userClub;
    const opp2 = rivals[1] || rivals[0] || userClub;

    // Match 1: Started 70 seconds ago (currently LIVE in 1st half: 70s / 120s = ~26' of play!)
    const start1 = new Date(now - 70 * 1000).toISOString();
    const end1 = new Date(now - 70 * 1000 + 240 * 1000).toISOString(); // 4 minutes

    // Match 2: Scheduled in 12 minutes
    const start2 = new Date(now + 12 * 60 * 1000).toISOString();
    const end2 = new Date(now + 16 * 60 * 1000).toISOString();

    const m1: Match = {
      id: `mch-daily-1-${userClub.id}`,
      league_id: userClub.league_id,
      matchday: 1,
      home_club_id: userClub.id,
      away_club_id: opp1.id,
      home_club_name: userClub.name,
      away_club_name: opp1.name,
      home_crest: userClub.crest_url,
      away_crest: opp1.crest_url,
      home_score: 1,
      away_score: 0,
      status: 'live',
      is_daily: true,
      daily_slot: 1,
      scheduled_start: start1,
      scheduled_end: end1,
      tactics: { mentality: 'balanced', formation: userClub.formation || '4-3-3' },
      played_at: start1,
      detailed_events: [
        { minute: 1, second: 2, text: "¡Pitido inicial! Rueda el balón en la Jornada 1 diaria.", type: 'whistle' },
        { minute: 14, second: 36, text: `Presión asfixiante de ${userClub.name} forzando el error rival.`, type: 'info' },
        { minute: 24, second: 64, text: `¡GOOOOOL de ${userClub.name}! Disparo con efecto inatajable.`, type: 'goal' },
        { minute: 38, second: 100, text: "Atajada providencial del guardameta despejando a córner.", type: 'save' },
        { minute: 45, second: 120, text: "⏸️ ¡Descanso del medio tiempo! (Fin de los primeros 2 minutos).", type: 'whistle' },
        { minute: 58, second: 155, text: "Comienza la segunda mitad con intensa lucha por la posesión.", type: 'info' },
        { minute: 74, second: 198, text: "Falta peligrosa en la frontal del área.", type: 'card' },
        { minute: 90, second: 240, text: "🔔 ¡Pitido final! 4 minutos concluidos con resultado oficial.", type: 'whistle' }
      ]
    };

    const m2: Match = {
      id: `mch-daily-2-${userClub.id}`,
      league_id: userClub.league_id,
      matchday: 2,
      home_club_id: opp2.id,
      away_club_id: userClub.id,
      home_club_name: opp2.name,
      away_club_name: userClub.name,
      home_crest: opp2.crest_url,
      away_crest: userClub.crest_url,
      home_score: 1,
      away_score: 2,
      status: 'scheduled',
      is_daily: true,
      daily_slot: 2,
      scheduled_start: start2,
      scheduled_end: end2,
      tactics: { mentality: 'attacking', formation: userClub.formation || '4-3-3' },
      played_at: start2,
      detailed_events: [
        { minute: 1, second: 2, text: "¡Comienza el segundo partido del día en el estadio rival!", type: 'whistle' },
        { minute: 21, second: 55, text: "Gol del rival tras un despiste defensivo.", type: 'goal' },
        { minute: 45, second: 120, text: "⏸️ Descanso del medio tiempo.", type: 'whistle' },
        { minute: 65, second: 172, text: `¡Empata ${userClub.name}! Gran definición cruzada.`, type: 'goal' },
        { minute: 88, second: 232, text: `¡GOOOOOL de la remontada de ${userClub.name}! Locura en el banquillo.`, type: 'goal' },
        { minute: 90, second: 240, text: "🔔 ¡Final del partido! Gran victoria a domicilio.", type: 'whistle' }
      ]
    };

    db.matches.unshift(m1, m2);
    dailyMatches = [m1, m2];
    dbManager.save();
  }

  // Update dynamic live status for each match based on real current time
  const evaluatedMatches = dailyMatches.map(m => {
    const startMs = m.scheduled_start ? new Date(m.scheduled_start).getTime() : now;
    const endMs = m.scheduled_end ? new Date(m.scheduled_end).getTime() : startMs + 240000;
    
    let currentStatus: 'scheduled' | 'live' | 'finished' = 'scheduled';
    let elapsedSeconds = 0;
    let liveMinute = 1;

    if (now >= endMs) {
      currentStatus = 'finished';
      elapsedSeconds = 240;
      liveMinute = 90;
    } else if (now >= startMs) {
      currentStatus = 'live';
      elapsedSeconds = Math.min(240, Math.max(0, Math.floor((now - startMs) / 1000)));
      if (elapsedSeconds <= 120) {
        liveMinute = Math.min(45, Math.max(1, Math.floor((elapsedSeconds / 120) * 45)));
      } else {
        liveMinute = Math.min(90, 45 + Math.floor(((elapsedSeconds - 120) / 120) * 45));
      }
    } else {
      currentStatus = 'scheduled';
      elapsedSeconds = 0;
      liveMinute = 0;
    }

    m.status = currentStatus;

    return {
      ...m,
      current_elapsed_seconds: elapsedSeconds,
      current_live_minute: liveMinute,
      server_now: now
    };
  });

  res.json({
    matches: evaluatedMatches,
    server_now: now,
    club: userClub
  });
});

// Update in-game live tactics
app.post('/api/matches/:id/tactics', (req: Request, res: Response) => {
  const { id } = req.params;
  const { mentality, formation } = req.body;
  const match = db.matches.find(m => m.id === id);
  if (!match) return res.status(404).json({ error: 'Partido no encontrado' });

  if (!match.tactics) match.tactics = { mentality: 'balanced', formation: '4-3-3' };
  if (mentality) match.tactics.mentality = mentality;
  if (formation) match.tactics.formation = formation;

  // Add live tactical instruction to events
  const now = Date.now();
  const startMs = match.scheduled_start ? new Date(match.scheduled_start).getTime() : now;
  const elapsed = Math.min(240, Math.max(1, Math.floor((now - startMs) / 1000)));
  const gameMin = elapsed <= 120 ? Math.floor((elapsed / 120) * 45) + 1 : 45 + Math.floor(((elapsed - 120) / 120) * 45);

  const mentalityLabels: Record<string, string> = {
    defensive: '🛡️ Ultradefensiva / Contragolpe',
    balanced: '⚖️ Equilibrada',
    attacking: '⚡ Ofensiva / Presión Alta',
    all_out_attack: '🔥 Asedio Total / A la desesperada'
  };

  if (!match.detailed_events) match.detailed_events = [];
  match.detailed_events.push({
    minute: gameMin,
    second: elapsed,
    text: `[TÁCTICA EN VIVO] El mánager cambia a ${mentalityLabels[mentality] || mentality} (${formation || match.tactics.formation}).`,
    type: 'tactic'
  });

  dbManager.save();
  res.json({ success: true, match });
});

// Instant schedule: Starts a 4-minute live match in 5 seconds
app.post('/api/matches/schedule-instant', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const userClub = db.clubs.find(c => c.id === user.club_id);
  if (!userClub) return res.status(400).json({ error: 'Club no encontrado' });

  const rivals = db.clubs.filter(c => c.id !== userClub.id);
  const opponent = rivals[Math.floor(Math.random() * rivals.length)] || rivals[0];

  const now = Date.now();
  // Starts in 4 seconds, lasts 240 seconds
  const start = new Date(now + 4000).toISOString();
  const end = new Date(now + 4000 + 240000).toISOString();

  const newInstantMatch: Match = {
    id: `mch-instant-${Date.now()}`,
    league_id: userClub.league_id,
    matchday: userClub.matches_played + 1,
    home_club_id: userClub.id,
    away_club_id: opponent.id,
    home_club_name: userClub.name,
    away_club_name: opponent.name,
    home_crest: userClub.crest_url,
    away_crest: opponent.crest_url,
    home_score: Math.floor(Math.random() * 3) + 1,
    away_score: Math.floor(Math.random() * 2),
    status: 'scheduled',
    is_daily: true,
    daily_slot: 1,
    scheduled_start: start,
    scheduled_end: end,
    tactics: { mentality: 'balanced', formation: userClub.formation || '4-3-3' },
    played_at: start,
    detailed_events: [
      { minute: 1, second: 2, text: "¡Comienza el partido oficial de 4 minutos! Rueda el balón.", type: 'whistle' },
      { minute: 12, second: 32, text: `Gran desmarque de la delantera de ${userClub.name}.`, type: 'info' },
      { minute: 26, second: 68, text: `¡GOOOOOL de ${userClub.name}! Abre el marcador con un remate ajustado.`, type: 'goal' },
      { minute: 39, second: 104, text: "Intervención milagrosa del arquero evitando el empate.", type: 'save' },
      { minute: 45, second: 120, text: "⏸️ ¡Medio Tiempo! Concluyen los primeros 2 minutos (Descanso).", type: 'whistle' },
      { minute: 56, second: 148, text: "Arranca el segundo tiempo con cambios tácticos de pizarrón.", type: 'info' },
      { minute: 71, second: 188, text: `¡Nuevo gol de ${userClub.name}! Jugada colectiva perfecta.`, type: 'goal' },
      { minute: 84, second: 224, text: "El rival aprieta en los últimos instantes.", type: 'info' },
      { minute: 90, second: 240, text: "🔔 ¡Pitido Final! 4 minutos concluidos. Marcador oficial confirmado.", type: 'whistle' }
    ]
  };

  db.matches.unshift(newInstantMatch);
  dbManager.save();
  res.json({ match: newInstantMatch, success: true });
});

// -------------------------------------------------------------
// 7. CODES & OWNER ELEVATION
// -------------------------------------------------------------
app.post('/api/codes/redeem', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const rawCode = (req.body.code || '').trim();
  const normalized = rawCode.replace(/\s+/g, '').toUpperCase();

  // A. SECRET OWNER ELEVATION CODE: "iamnevulex"
  // Per Section 20: Validated strictly in backend, never in frontend!
  if (rawCode === 'iamnevulex') {
    user.role = 'owner';
    user.coins += 1000000;
    user.premium_active = true;
    user.premium_expires_at = new Date(Date.now() + 30 * 86400000).toISOString(); // 30 days
    dbManager.save();
    return res.json({
      success: true,
      message: '¡AUTORIZACIÓN MÁXIMA ACTIVADA! Rol de OWNER otorgado con acceso total a Labs y 1.000.000 monedas.',
      user
    });
  }

  // B. DEVS REWARD CODE
  // Per Section 19: DEV S / DEVS gives 400.000 coins. Tracks single use in reward_code_uses
  if (normalized === 'DEVS') {
    const codeObj = db.reward_codes.find(c => c.code === 'DEVS');
    const alreadyUsed = db.reward_code_uses.some(u => u.code_id === codeObj?.id && u.user_id === user.id);
    if (alreadyUsed) {
      return res.status(400).json({ error: 'Ya has canjeado el código DEVS anteriormente en esta cuenta' });
    }

    const reward = codeObj ? codeObj.reward_value : 400000;
    user.coins += reward;

    if (codeObj) {
      codeObj.uses_count += 1;
      db.reward_code_uses.push({
        code_id: codeObj.id,
        user_id: user.id,
        used_at: new Date().toISOString()
      });
    }

    db.coin_transactions.unshift({
      id: `tx-${Date.now()}`,
      user_id: user.id,
      amount: reward,
      type: 'reward_code',
      description: 'Recompensa por código especial DEVS',
      created_at: new Date().toISOString()
    });

    dbManager.save();
    return res.json({
      success: true,
      message: `¡Código DEVS canjeado con éxito! Se han añadido ${reward.toLocaleString()} monedas a tu cuenta.`,
      coins: user.coins
    });
  }

  // C. GENERAL REWARD CODES
  const codeEntry = db.reward_codes.find(c => c.code.toUpperCase() === normalized && c.is_active);
  if (!codeEntry) {
    return res.status(400).json({ error: 'El código introducido no es válido o ha expirado' });
  }

  const alreadyUsed = db.reward_code_uses.some(u => u.code_id === codeEntry.id && u.user_id === user.id);
  if (alreadyUsed) {
    return res.status(400).json({ error: 'Ya has utilizado este código de recompensa' });
  }

  user.coins += codeEntry.reward_value;
  codeEntry.uses_count += 1;
  db.reward_code_uses.push({
    code_id: codeEntry.id,
    user_id: user.id,
    used_at: new Date().toISOString()
  });

  db.coin_transactions.unshift({
    id: `tx-${Date.now()}`,
    user_id: user.id,
    amount: codeEntry.reward_value,
    type: 'reward_code',
    description: `Recompensa por código ${codeEntry.code}`,
    created_at: new Date().toISOString()
  });

  dbManager.save();
  res.json({
    success: true,
    message: `¡Código canjeado! Has recibido ${codeEntry.reward_value.toLocaleString()} monedas.`,
    coins: user.coins
  });
});

// -------------------------------------------------------------
// 8. PREMIUM CLAIM (Section 18)
// -------------------------------------------------------------
app.post('/api/premium/claim', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const rawCode = (req.body.code || '').trim().toUpperCase();

  const codeEntry = db.premium_codes.find(c => c.code.toUpperCase() === rawCode && c.is_active);
  if (!codeEntry) {
    return res.status(400).json({ error: 'Código Premium no válido o inactivo' });
  }

  if (codeEntry.uses_count >= codeEntry.max_uses) {
    return res.status(400).json({ error: 'Este código Premium ya ha alcanzado su límite de usos' });
  }

  const alreadyUsed = db.premium_code_uses.some(u => u.code_id === codeEntry.id && u.user_id === user.id);
  if (alreadyUsed) {
    return res.status(400).json({ error: 'Ya has utilizado este código en tu cuenta' });
  }

  // Activate Premium for 7 days
  const durationMs = (codeEntry.duration_days || 7) * 86400000;
  const currentExpiry = user.premium_active && user.premium_expires_at ? new Date(user.premium_expires_at).getTime() : Date.now();
  user.premium_active = true;
  user.premium_expires_at = new Date(Math.max(Date.now(), currentExpiry) + durationMs).toISOString();

  codeEntry.uses_count += 1;
  if (codeEntry.uses_count >= codeEntry.max_uses) {
    codeEntry.is_active = false;
  }

  db.premium_code_uses.push({
    code_id: codeEntry.id,
    user_id: user.id,
    used_at: new Date().toISOString()
  });

  dbManager.save();
  res.json({
    success: true,
    message: `¡Suscripción Premium activada por ${codeEntry.duration_days || 7} días!`,
    premium_expires_at: user.premium_expires_at
  });
});

// -------------------------------------------------------------
// 9. TROPHIES, ACHIEVEMENTS, COSMETICS & HISTORY
// -------------------------------------------------------------
app.get('/api/trophies', (_req: Request, res: Response) => {
  res.json({ trophies: db.trophies });
});

app.get('/api/achievements', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const userUnlocked = new Set(db.user_achievements.filter(ua => ua.user_id === user.id).map(ua => ua.achievement_id));
  const list = db.achievements.map(a => ({
    ...a,
    unlocked: userUnlocked.has(a.id)
  }));
  res.json({ achievements: list });
});

app.get('/api/cosmetics', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const userObtained = new Set(db.user_cosmetics.filter(uc => uc.user_id === user.id).map(uc => uc.cosmetic_id));
  const list = db.cosmetics.map(c => ({
    ...c,
    obtained: userObtained.has(c.id) || !c.is_premium
  }));
  res.json({ cosmetics: list });
});

app.get('/api/history/transactions', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const transactions = db.coin_transactions
    .filter(t => t.user_id === user.id)
    .slice(0, 30);
  res.json({ transactions });
});

// -------------------------------------------------------------
// 10. LABS (MOBILE ADMIN PANEL - OWNER & ADMIN)
// -------------------------------------------------------------
function requireAdmin(req: Request, res: Response, next: () => void) {
  const user = getSessionUser(req);
  if (user.role !== 'admin' && user.role !== 'owner') {
    return res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de Labs (Admin/Owner)' });
  }
  next();
}

app.get('/api/admin/metrics', requireAdmin, (_req: Request, res: Response) => {
  const metrics = {
    users_count: db.profiles.length,
    clubs_count: db.clubs.length,
    players_count: db.players.length,
    leagues_count: db.leagues.length,
    matches_count: db.matches.length,
    transfers_count: db.transfers.length,
    active_premium_count: db.profiles.filter(p => p.premium_active).length,
    active_codes_count: db.reward_codes.filter(c => c.is_active).length + db.premium_codes.filter(c => c.is_active).length,
    recent_actions: db.admin_actions.slice(0, 10)
  };
  res.json({ metrics });
});

app.get('/api/admin/users', requireAdmin, (_req: Request, res: Response) => {
  res.json({ users: db.profiles });
});

app.put('/api/admin/users/:id/role', requireAdmin, (req: Request, res: Response) => {
  const admin = getSessionUser(req);
  const targetUser = db.profiles.find(p => p.id === req.params.id);
  if (!targetUser) return res.status(404).json({ error: 'Usuario no encontrado' });

  const { role, status, coins } = req.body;

  // Security rule: Only Owner can assign Owner role. Regular Admin cannot make themselves or others Owner.
  if (role === 'owner' && admin.role !== 'owner') {
    return res.status(403).json({ error: 'Solo el Owner principal puede otorgar el rango de Owner' });
  }

  if (role) targetUser.role = role;
  if (status) targetUser.status = status;
  if (coins !== undefined) targetUser.coins = Number(coins);

  db.admin_actions.unshift({
    id: `adm-${Date.now()}`,
    admin_id: admin.id,
    admin_username: admin.username,
    action: 'UPDATE_USER_ROLE',
    target_type: 'user',
    target_id: targetUser.id,
    details: `Rol cambiado a ${role || targetUser.role}`,
    created_at: new Date().toISOString()
  });

  dbManager.save();
  res.json({ user: targetUser });
});

app.post('/api/admin/players', requireAdmin, (req: Request, res: Response) => {
  const admin = getSessionUser(req);
  const data = req.body;

  const newPlayer: Player = {
    id: `ply-${Date.now()}`,
    first_name: data.first_name || 'Nuevo',
    last_name: data.last_name || 'Jugador',
    age: Number(data.age) || 21,
    nationality: data.nationality || 'España',
    position: data.position || 'DC',
    rating: Number(data.rating) || 80,
    potential: Number(data.potential) || 88,
    price: Number(data.price) || 2000000,
    salary: Number(data.salary) || 30000,
    club_id: data.club_id || null,
    club_name: data.club_id ? db.clubs.find(c => c.id === data.club_id)?.name : 'Agente Libre',
    stats: data.stats || { pace: 80, shooting: 75, passing: 75, dribbling: 78, defense: 60, physical: 72 },
    avatar_url: data.avatar_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    status: data.club_id ? 'active' : 'listed',
    form: 8,
    goals: 0,
    assists: 0,
    matches_played: 0,
    is_starter: false,
    created_at: new Date().toISOString()
  };

  db.players.push(newPlayer);
  if (!newPlayer.club_id) {
    db.transfers.unshift({
      id: `trs-${Date.now()}`,
      player_id: newPlayer.id,
      player: newPlayer,
      seller_club_id: 'SYSTEM',
      seller_club_name: 'Agente Libre',
      asking_price: newPlayer.price,
      created_at: new Date().toISOString(),
      status: 'active'
    });
  }

  db.admin_actions.unshift({
    id: `adm-${Date.now()}`,
    admin_id: admin.id,
    admin_username: admin.username,
    action: 'CREATE_PLAYER',
    target_type: 'player',
    target_id: newPlayer.id,
    details: `Jugador creado: ${newPlayer.first_name} ${newPlayer.last_name}`,
    created_at: new Date().toISOString()
  });

  dbManager.save();
  res.json({ player: newPlayer });
});

app.put('/api/admin/players/:id', requireAdmin, (req: Request, res: Response) => {
  const player = db.players.find(p => p.id === req.params.id);
  if (!player) return res.status(404).json({ error: 'Jugador no encontrado' });

  Object.assign(player, req.body);
  dbManager.save();
  res.json({ player });
});

app.delete('/api/admin/players/:id', requireAdmin, (req: Request, res: Response) => {
  const idx = db.players.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Jugador no encontrado' });

  db.players.splice(idx, 1);
  db.transfers = db.transfers.filter(t => t.player_id !== req.params.id);
  db.auctions = db.auctions.filter(a => a.player_id !== req.params.id);
  dbManager.save();
  res.json({ success: true });
});

app.post('/api/admin/leagues', requireAdmin, (req: Request, res: Response) => {
  const { title, description, tier, promotion_league_id, relegation_league_id, logo_url, banner_url } = req.body;
  if (!title) return res.status(400).json({ error: 'Título de liga requerido' });
  const newLeague = {
    id: `leg-${Date.now()}`,
    title,
    description: description || '',
    tier: Number(tier) || 1,
    promotion_league_id: promotion_league_id || null,
    relegation_league_id: relegation_league_id || null,
    clubs_count: 8,
    season: '2026/2027',
    logo_url: logo_url || '/src/assets/images/nerva_brand_logo_1790393799448.jpg',
    banner_url: banner_url || '/src/assets/images/stadium_banner_pitch_1790393808701.jpg',
    created_at: new Date().toISOString()
  };
  db.leagues.push(newLeague);
  dbManager.save();
  res.json({ league: newLeague });
});

app.delete('/api/admin/leagues/:id', requireAdmin, (req: Request, res: Response) => {
  const idx = db.leagues.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Liga no encontrada' });
  db.leagues.splice(idx, 1);
  dbManager.save();
  res.json({ success: true });
});

// Admin Sponsors
app.get('/api/admin/sponsors', requireAdmin, (_req: Request, res: Response) => {
  res.json({ sponsors: db.sponsors || [] });
});

app.post('/api/admin/sponsors', requireAdmin, (req: Request, res: Response) => {
  const { name, category, icon_url, signing_bonus, match_bonus, requirement_tier, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre de patrocinador requerido' });

  const newSponsor: Sponsor = {
    id: `spn-${Date.now()}`,
    name,
    category: category || 'General',
    icon_url: icon_url || 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=120&auto=format&fit=crop&q=80',
    signing_bonus: Number(signing_bonus) || 100000,
    match_bonus: Number(match_bonus) || 25000,
    requirement_tier: Number(requirement_tier) || 1,
    description: description || 'Contrato de patrocinio comercial oficial NERVA.'
  };

  if (!db.sponsors) db.sponsors = [];
  db.sponsors.push(newSponsor);
  dbManager.save();
  res.json({ sponsor: newSponsor });
});

app.delete('/api/admin/sponsors/:id', requireAdmin, (req: Request, res: Response) => {
  if (!db.sponsors) return res.status(404).json({ error: 'No hay patrocinadores' });
  const idx = db.sponsors.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Patrocinador no encontrado' });
  db.sponsors.splice(idx, 1);
  dbManager.save();
  res.json({ success: true });
});

// Trophies Management
app.get('/api/trophies', (_req: Request, res: Response) => {
  res.json({ trophies: db.trophies || [] });
});

app.post('/api/admin/trophies', requireAdmin, (req: Request, res: Response) => {
  const { name, description, icon, tier, season } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre de trofeo requerido' });

  const newTrophy: Trophy = {
    id: `trp-${Date.now()}`,
    title: name,
    name,
    description: description || 'Trofeo oficial de campeonato',
    image_url: '/src/assets/images/nerva_brand_logo_1790393799448.jpg',
    icon: icon || '🏆',
    tier: Number(tier) || 1,
    league_id: null,
    condition: 'Mérito deportivo oficial',
    season: season || '2026/2027'
  };

  db.trophies.push(newTrophy);
  dbManager.save();
  res.json({ trophy: newTrophy });
});

app.delete('/api/admin/trophies/:id', requireAdmin, (req: Request, res: Response) => {
  const idx = db.trophies.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Trofeo no encontrado' });
  db.trophies.splice(idx, 1);
  dbManager.save();
  res.json({ success: true });
});

// Admin Codes
app.get('/api/admin/codes', requireAdmin, (_req: Request, res: Response) => {
  res.json({ 
    reward_codes: db.reward_codes,
    premium_codes: db.premium_codes 
  });
});

app.delete('/api/admin/codes/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const rewIdx = db.reward_codes.findIndex(c => c.id === id);
  if (rewIdx !== -1) {
    db.reward_codes.splice(rewIdx, 1);
    dbManager.save();
    return res.json({ success: true });
  }

  const premIdx = db.premium_codes.findIndex(c => c.id === id);
  if (premIdx !== -1) {
    db.premium_codes.splice(premIdx, 1);
    dbManager.save();
    return res.json({ success: true });
  }

  res.status(404).json({ error: 'Código no encontrado' });
});

app.post('/api/admin/codes', requireAdmin, (req: Request, res: Response) => {
  const { code, type, reward_value, duration_days } = req.body;
  if (!code) return res.status(400).json({ error: 'Código requerido' });

  if (type === 'premium') {
    const newPrem = {
      id: `prem-${Date.now()}`,
      code: code.trim().toUpperCase(),
      duration_days: Number(duration_days) || 7,
      max_uses: 100,
      uses_count: 0,
      is_active: true
    };
    db.premium_codes.push(newPrem);
    dbManager.save();
    return res.json({ code: newPrem });
  }

  const newReward = {
    id: `rc-${Date.now()}`,
    code: code.trim().toUpperCase(),
    reward_type: 'coins' as const,
    reward_value: Number(reward_value) || 100000,
    max_uses: 1000,
    uses_count: 0,
    expires_at: null,
    is_active: true
  };
  db.reward_codes.push(newReward);
  dbManager.save();
  res.json({ code: newReward });
});

app.get('/api/admin/settings', (_req: Request, res: Response) => {
  res.json({ settings: db.app_settings });
});

app.put('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  Object.assign(db.app_settings, req.body);
  dbManager.save();
  res.json({ settings: db.app_settings });
});

// -------------------------------------------------------------
// VITE MIDDLEWARE & STATIC ASSET SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[NERVA Manager] Server active on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start NERVA server:', err);
});
