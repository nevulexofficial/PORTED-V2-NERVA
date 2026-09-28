import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { dbManager, db } from './src/server/db.ts';
import { Profile, Club, Player, PlayerPosition, UserRole, Standing, Match, Sponsor, Trophy, Auction } from './src/types/index.ts';

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
  const { username, password, display_name, club_name, avatar_url, crest_url } = req.body;
  if (!username || !password || !display_name) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (usuario, contraseña o nombre)' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
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
    crest_url: crest_url || '/src/assets/images/crest_titan_fc_1790393819091.jpg',
    banner_url: '/src/assets/images/stadium_banner_pitch_1790393808701.jpg',
    description: 'Club fundado en la liga oficial de NERVA.',
    budget: 50000,
    valuation: 8500000,
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
    reputation: 950,
    fans: 5000,
    level: 0,
    xp: 0,
    stadium_level: 0,
    stadium_name: 'Cancha Municipal',
    stadium_capacity: 2500,
    active_sponsor_ids: [],
    primary_kit_color: '#10b981',
    secondary_kit_color: '#0f172a',
    kit_pattern: 'solid',
    created_at: new Date().toISOString()
  };

  const newUser: Profile = {
    id: newUserId,
    username: username.toLowerCase().trim(),
    display_name: display_name.trim(),
    avatar_url: avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    coins: 50000,
    role: 'user', // Standard user, never owner or admin
    premium_active: false, // Never active by default
    premium_expires_at: null,
    club_id: newClubId,
    status: 'active',
    password_hash: password,
    created_at: new Date().toISOString()
  };

  db.profiles.push(newUser);
  db.clubs.push(newClub);

  // Add new club to league standings table immediately
  const newStanding: Standing = {
    id: `std-${newClubId}`,
    league_id: newClub.league_id,
    club_id: newClub.id,
    club_name: newClub.name,
    crest_url: newClub.crest_url,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goals_for: 0,
    goals_against: 0,
    goal_diff: 0,
    points: 0
  };
  db.standings.push(newStanding);

  // Per User Requirement: "cada club al crear cuenta tendra 15 jugadores, con un ovr de 15-10"
  const starterPositionsConfig: { pos: PlayerPosition; isStarter: boolean }[] = [
    { pos: 'POR', isStarter: true },
    { pos: 'LD', isStarter: true },
    { pos: 'DFC', isStarter: true },
    { pos: 'DFC', isStarter: true },
    { pos: 'LI', isStarter: true },
    { pos: 'MCD', isStarter: true },
    { pos: 'MC', isStarter: true },
    { pos: 'MCO', isStarter: true },
    { pos: 'ED', isStarter: true },
    { pos: 'DC', isStarter: true },
    { pos: 'EI', isStarter: true },
    { pos: 'POR', isStarter: false },
    { pos: 'DFC', isStarter: false },
    { pos: 'MC', isStarter: false },
    { pos: 'DC', isStarter: false },
  ];

  const starterFirstNames = ['Mateo', 'Lucas', 'Diego', 'Thiago', 'Joao', 'Gael', 'Leo', 'Bruno', 'Axel', 'Enzo', 'Nico', 'Alonso', 'Facundo', 'Ian', 'Tomas'];
  const starterLastNames = ['Vargas', 'Rojas', 'Mendoza', 'Flores', 'Silva', 'Castro', 'Romero', 'Navarro', 'Salas', 'Chavez', 'Paredes', 'Herrera', 'Cruz', 'Morales', 'Perez'];
  const starterAvatars = [
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
  ];

  starterPositionsConfig.forEach((slot, idx) => {
    // Rating strictly between 10 and 15 (OVR 10-15)
    const rating = Math.floor(Math.random() * 6) + 10;
    const potential = rating + Math.floor(Math.random() * 35) + 30; // 40-75 potential
    const age = Math.floor(Math.random() * 5) + 17; // 17-21 youthful prospects
    const price = rating * 3500 + 15000;
    const salary = Math.max(500, rating * 80);

    const starterPlayer: Player = {
      id: `starter-${newClubId}-${idx + 1}`,
      first_name: starterFirstNames[idx % starterFirstNames.length],
      last_name: starterLastNames[idx % starterLastNames.length],
      age,
      nationality: 'Nacional',
      position: slot.pos,
      rating,
      potential,
      price,
      salary,
      club_id: newClubId,
      club_name: newClub.name,
      avatar_url: starterAvatars[idx % starterAvatars.length],
      status: 'active',
      is_starter: slot.isStarter,
      form: 7,
      goals: 0,
      assists: 0,
      matches_played: 0,
      xp: 0,
      injury_matches_remaining: 0,
      stats: {
        pace: rating + Math.floor(Math.random() * 4) - 2,
        shooting: rating + Math.floor(Math.random() * 4) - 2,
        passing: rating + Math.floor(Math.random() * 4) - 2,
        dribbling: rating + Math.floor(Math.random() * 4) - 2,
        defense: rating + Math.floor(Math.random() * 4) - 2,
        physical: rating + Math.floor(Math.random() * 4) - 2,
      },
      created_at: new Date().toISOString()
    };

    db.players.push(starterPlayer);
  });

  // Record initial welcome bonus
  db.coin_transactions.push({
    id: `tx-${Date.now()}`,
    user_id: newUserId,
    amount: 50000,
    type: 'reward_code',
    description: 'Presupuesto inicial de fundación del Club',
    created_at: new Date().toISOString()
  });

  dbManager.save();
  res.json({ user: newUser, club: newClub, token: newUser.id });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Introduce tu nombre de usuario' });
  }

  const user = db.profiles.find(p => p.username.toLowerCase() === (username || '').toLowerCase().trim());
  if (!user) {
    return res.status(404).json({ error: 'Usuario no registrado' });
  }

  // Validate password
  if (user.password_hash && password !== undefined) {
    if (user.password_hash !== password) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
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

          // Winner notification
          db.notifications.unshift({
            id: `notif-auc-${Date.now()}`,
            user_id: winningUser.id,
            club_id: winningUser.club_id,
            title: `🏆 ¡Fichaje en Subasta Conquistado!`,
            message: `Al encabezar la subasta de 6 minutos con ${a.current_bid.toLocaleString()} €, ${player.first_name} ${player.last_name} se une a tu plantilla oficial.`,
            type: 'social',
            read: false,
            created_at: new Date().toISOString()
          });
        }
      }
    }
  });

  // Ensure there is always at least one active 6-minute auction
  const hasActive = db.auctions.some(a => a.status === 'active');
  if (!hasActive) {
    const candidate = db.players.find(p => p.status !== 'auction' && (p.club_id === null || p.status === 'listed')) || db.players[0];
    if (candidate) {
      candidate.status = 'auction';
      const newAuction: Auction = {
        id: `auc-${Date.now()}`,
        player_id: candidate.id,
        player: candidate,
        starting_bid: Math.max(500000, Math.floor(candidate.price * 0.7)),
        current_bid: Math.max(500000, Math.floor(candidate.price * 0.7)),
        highest_bidder_id: null,
        highest_bidder_club_name: null,
        starts_at: new Date(now).toISOString(),
        ends_at: new Date(now + 6 * 60 * 1000).toISOString(), // Exact 6-minute auction limit!
        status: 'active'
      };
      db.auctions.unshift(newAuction);
    }
  }

  const auctions = db.auctions.map(a => {
    const player = db.players.find(p => p.id === a.player_id);
    return { ...a, player: player || a.player };
  });
  res.json({ auctions });
});

app.post('/api/auctions/start-for-player', (req: Request, res: Response) => {
  const { player_id } = req.body;
  const player = db.players.find(p => p.id === player_id);
  if (!player) return res.status(404).json({ error: 'Jugador no encontrado' });

  const now = Date.now();
  player.status = 'auction';
  const newAuction: Auction = {
    id: `auc-${Date.now()}`,
    player_id: player.id,
    player,
    starting_bid: Math.max(500000, Math.floor(player.price * 0.7)),
    current_bid: Math.max(500000, Math.floor(player.price * 0.7)),
    highest_bidder_id: null,
    highest_bidder_club_name: null,
    starts_at: new Date(now).toISOString(),
    ends_at: new Date(now + 6 * 60 * 1000).toISOString(), // Exact 6-minute auction
    status: 'active'
  };
  db.auctions.unshift(newAuction);
  dbManager.save();
  res.json({ success: true, auction: newAuction });
});

// AI BATCH PLAYER GENERATION (Adds non-repeating players to both Auctions and Market transfers)
app.post('/api/market/generate-ai-batch', (req: Request, res: Response) => {
  const firstNamesPool = [
    'Christian', 'Paolo', 'Renato', 'André', 'Piero', 'Gianluca', 'Yoshimar', 'Edison', 
    'Alexander', 'Carlos', 'Pedro', 'Sergio', 'Bryan', 'Franco', 'Matías', 'Gabriel', 
    'Joao', 'Thiago', 'Lucas', 'Nicolás', 'Mateo', 'Enzo', 'Lautaro', 'Rodrigo', 'Federico',
    'Darwin', 'Julián', 'Vinícius', 'Neymar', 'Endrick', 'Santiago', 'Sebastián', 'Alexis'
  ];
  const lastNamesPool = [
    'Cueva', 'Guerrero', 'Tapia', 'Carrillo', 'Quispe', 'Lapadula', 'Yotún', 'Flores', 
    'Callens', 'Zambrano', 'Gallese', 'Peña', 'Reyna', 'Zanelatto', 'Grimaldo', 'Barcos', 
    'Castillo', 'Valera', 'Polo', 'Trauco', 'Advíncula', 'Loyola', 'Araujo', 'Santamarina', 
    'Medina', 'Corzo', 'Sánchez', 'Pacheco', 'Vargas', 'Alarcón', 'Palacios', 'Benavente'
  ];
  const avatarFaces = [
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80'
  ];
  const positionsPool: Player['position'][] = ['DC', 'EI', 'ED', 'MCO', 'MC', 'MCD', 'DFC', 'LI', 'LD', 'POR'];

  const generatedPlayers: Player[] = [];
  const now = Date.now();

  for (let i = 0; i < 6; i++) {
    // Find a unique name that does NOT exist anywhere in database
    let firstName = '';
    let lastName = '';
    let attempts = 0;
    while (attempts < 100) {
      firstName = firstNamesPool[Math.floor(Math.random() * firstNamesPool.length)];
      lastName = lastNamesPool[Math.floor(Math.random() * lastNamesPool.length)];
      const alreadyExists = db.players.some(p => 
        p.first_name.toLowerCase() === firstName.toLowerCase() && 
        p.last_name.toLowerCase() === lastName.toLowerCase()
      ) || generatedPlayers.some(p => 
        p.first_name.toLowerCase() === firstName.toLowerCase() && 
        p.last_name.toLowerCase() === lastName.toLowerCase()
      );
      if (!alreadyExists) break;
      attempts++;
    }

    const pos = positionsPool[i % positionsPool.length];
    const rating = Math.floor(Math.random() * 15) + 76; // 76 - 91
    const potential = Math.min(96, rating + Math.floor(Math.random() * 7) + 2);
    const age = Math.floor(Math.random() * 10) + 19; // 19 - 28
    const price = Math.round((rating * rating * 500 + Math.random() * 500000) / 10000) * 10000;
    const salary = Math.round(price * 0.015);
    const avatar = avatarFaces[i % avatarFaces.length];

    const isAuction = i < 3; // 3 in auctions, 3 in direct market transfers

    const newPlayer: Player = {
      id: `ai-ply-${now}-${i}`,
      first_name: firstName,
      last_name: lastName,
      age,
      nationality: Math.random() > 0.3 ? 'Perú' : 'Brasil',
      position: pos,
      rating,
      potential,
      price,
      salary,
      club_id: null,
      club_name: 'Agente Libre',
      avatar_url: avatar,
      status: isAuction ? 'auction' : 'listed',
      form: 8,
      goals: 0,
      assists: 0,
      matches_played: 0,
      stats: {
        pace: Math.floor(Math.random() * 20) + 72,
        shooting: pos === 'DC' || pos === 'EI' || pos === 'ED' ? Math.floor(Math.random() * 18) + 76 : Math.floor(Math.random() * 30) + 50,
        passing: Math.floor(Math.random() * 22) + 70,
        dribbling: Math.floor(Math.random() * 20) + 73,
        defense: pos === 'DFC' || pos === 'MCD' || pos === 'POR' ? Math.floor(Math.random() * 18) + 76 : Math.floor(Math.random() * 30) + 40,
        physical: Math.floor(Math.random() * 22) + 72
      },
      created_at: new Date().toISOString()
    };

    db.players.unshift(newPlayer);
    generatedPlayers.push(newPlayer);

    if (isAuction) {
      // Put in 6-minute active auction
      const newAuc: Auction = {
        id: `auc-${now}-${i}`,
        player_id: newPlayer.id,
        player: newPlayer,
        starting_bid: Math.max(500000, Math.floor(newPlayer.price * 0.7)),
        current_bid: Math.max(500000, Math.floor(newPlayer.price * 0.7)),
        highest_bidder_id: null,
        highest_bidder_club_name: null,
        starts_at: new Date(now).toISOString(),
        ends_at: new Date(now + 6 * 60 * 1000).toISOString(),
        status: 'active'
      };
      db.auctions.unshift(newAuc);
    } else {
      // Put in direct transfers list
      db.transfers.unshift({
        id: `tr-${now}-${i}`,
        player_id: newPlayer.id,
        player: newPlayer,
        seller_club_id: 'agency_market',
        seller_club_name: 'Agencia de Fichajes NERVA',
        asking_price: Math.floor(newPlayer.price * 0.95),
        status: 'active',
        created_at: new Date().toISOString()
      });
    }
  }

  dbManager.save();
  res.json({
    success: true,
    created: generatedPlayers.length,
    message: '¡6 futbolistas únicos generados con IA sin repetirse! 3 asignados a subastas de 6 minutos y 3 al mercado de fichajes directos.'
  });
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
  const leagueId = req.params.id;

  // Ensure every club belonging to this league has an active standing record
  const leagueClubs = db.clubs.filter(c => c.league_id === leagueId);
  let changed = false;

  leagueClubs.forEach(c => {
    let s = db.standings.find(st => st.club_id === c.id && st.league_id === leagueId);
    if (!s) {
      s = {
        id: `std-${c.id}`,
        league_id: leagueId,
        club_id: c.id,
        club_name: c.name,
        crest_url: c.crest_url,
        played: c.matches_played || 0,
        won: c.matches_won || 0,
        drawn: c.matches_drawn || 0,
        lost: c.matches_lost || 0,
        goals_for: c.goals_for || 0,
        goals_against: c.goals_against || 0,
        goal_diff: (c.goals_for || 0) - (c.goals_against || 0),
        points: ((c.matches_won || 0) * 3) + (c.matches_drawn || 0)
      };
      db.standings.push(s);
      changed = true;
    } else {
      // Sync latest name and crest
      if (s.club_name !== c.name || s.crest_url !== c.crest_url) {
        s.club_name = c.name;
        s.crest_url = c.crest_url;
        changed = true;
      }
    }
  });

  if (changed) {
    dbManager.save();
  }

  const standings = db.standings
    .filter(s => s.league_id === leagueId)
    .sort((a, b) => b.points - a.points || b.goal_diff - a.goal_diff || b.goals_for - a.goals_for);
  res.json({ standings });
});

app.get('/api/leagues/:id/matches', (req: Request, res: Response) => {
  const matches = db.matches
    .filter(m => m.league_id === req.params.id)
    .sort((a, b) => b.matchday - a.matchday);
  res.json({ matches });
});

app.get('/api/leagues/:id/stats', (req: Request, res: Response) => {
  const leagueId = req.params.id;
  const leagueClubs = db.clubs.filter(c => c.league_id === leagueId);
  const clubIds = new Set(leagueClubs.map(c => c.id));
  const leaguePlayers = db.players.filter(p => p.club_id && clubIds.has(p.club_id));

  // Top Scorers (Pichichi)
  let topScorers = [...leaguePlayers]
    .filter(p => (p.goals || 0) > 0)
    .sort((a, b) => (b.goals || 0) - (a.goals || 0) || b.rating - a.rating)
    .slice(0, 10);

  if (topScorers.length === 0) {
    topScorers = [...leaguePlayers]
      .filter(p => ['DC', 'EI', 'ED', 'MCO'].includes(p.position))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 8)
      .map((p, idx) => ({
        ...p,
        goals: Math.max(2, 14 - idx * 2),
        matches_played: 12
      }));
  }

  // Top Assists
  let topAssists = [...leaguePlayers]
    .filter(p => (p.assists || 0) > 0)
    .sort((a, b) => (b.assists || 0) - (a.assists || 0) || b.rating - a.rating)
    .slice(0, 10);

  if (topAssists.length === 0) {
    topAssists = [...leaguePlayers]
      .filter(p => ['MC', 'MCO', 'EI', 'ED', 'LI', 'LD'].includes(p.position))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 8)
      .map((p, idx) => ({
        ...p,
        assists: Math.max(1, 9 - idx),
        matches_played: 12
      }));
  }

  // Top Goalkeepers (POR)
  const topGoalkeepers = [...leaguePlayers]
    .filter(p => p.position === 'POR')
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5)
    .map(p => ({
      ...p,
      clean_sheets: Math.max(2, Math.floor(p.rating / 12)),
      goals_conceded: Math.max(3, 15 - Math.floor(p.rating / 8))
    }));

  // MVP / Mejor Valorados
  const topRated = [...leaguePlayers]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  // Overall Standings calculations
  const standings = db.standings.filter(s => s.league_id === leagueId);
  const totalMatches = standings.reduce((acc, s) => acc + (s.played || 0), 0) / 2;
  const totalGoals = standings.reduce((acc, s) => acc + (s.goals_for || 0), 0) || 68;
  const avgGoals = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : '2.83';

  const bestAttack = [...standings].sort((a, b) => (b.goals_for || 0) - (a.goals_for || 0))[0];
  const bestDefense = [...standings].sort((a, b) => (a.goals_against || 0) - (b.goals_against || 0))[0];

  res.json({
    stats: {
      topScorers,
      topAssists,
      topGoalkeepers,
      topRated,
      totalGoals,
      totalMatches: Math.max(12, Math.floor(totalMatches)),
      avgGoals,
      bestAttack: bestAttack ? { club_name: bestAttack.club_name, goals: bestAttack.goals_for } : null,
      bestDefense: bestDefense ? { club_name: bestDefense.club_name, goals_conceded: bestDefense.goals_against } : null,
    }
  });
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

  // Reputation & Fans adjustment: Won: +10 rep, Draw: +2 rep, Lost: -5 rep
  if (winnerId === userClub.id) {
    userClub.reputation = (userClub.reputation || 1000) + 10;
    userClub.fans = Math.min(8000000000, (userClub.fans || 5000) + 3500);
  } else if (homeScore === awayScore) {
    userClub.reputation = (userClub.reputation || 1000) + 2;
    userClub.fans = Math.min(8000000000, (userClub.fans || 5000) + 800);
  } else {
    userClub.reputation = Math.max(0, (userClub.reputation || 1000) - 5);
  }

  // Sponsor selection trigger: minimum 1200 reputation required
  if (userClub.reputation >= 1200 && db.sponsors && db.sponsors.length > 0) {
    const maxSponsorsAllowed = Math.min(20, Math.max(1, (userClub.stadium_level || 0) * 2));
    const activeCount = userClub.active_sponsor_ids?.length || (userClub.active_sponsor_id ? 1 : 0);
    const hasPending = db.sponsor_offers.some(o => o.club_id === userClub.id && o.status === 'pending');
    
    if (!hasPending && activeCount < maxSponsorsAllowed && Math.random() > 0.2) {
      const availableSponsors = db.sponsors.filter(s => 
        !userClub.active_sponsor_ids?.includes(s.id) && userClub.active_sponsor_id !== s.id
      );
      if (availableSponsors.length > 0) {
        const selectedSpn = availableSponsors[Math.floor(Math.random() * availableSponsors.length)];
        const newOffer = {
          id: `spn-off-${Date.now()}`,
          club_id: userClub.id,
          sponsor_id: selectedSpn.id,
          sponsor_name: selectedSpn.name,
          sponsor_icon: selectedSpn.icon_url,
          category: selectedSpn.category,
          signing_bonus: selectedSpn.signing_bonus,
          match_bonus: selectedSpn.match_bonus,
          required_reputation: 1200,
          status: 'pending' as const,
          created_at: new Date().toISOString()
        };
        db.sponsor_offers.unshift(newOffer);
        db.notifications.unshift({
          id: `notif-${Date.now()}`,
          user_id: user.id,
          club_id: userClub.id,
          title: `¡Oferta de Patrocinio de ${selectedSpn.name}!`,
          message: `${selectedSpn.name} ha visto tu reputación de ${userClub.reputation} pts y desea patrocinar a tu club. Revisa la oferta en Notificaciones.`,
          type: 'sponsor_offer',
          data: newOffer,
          read: false,
          created_at: new Date().toISOString()
        });
      }
    }
  }

  // -------------------------------------------------------------
  // INJURIES & PLAYER EXPERIENCE IMPROVEMENT PER MATCH
  // -------------------------------------------------------------
  // 1. Club XP Progression (0-80 System)
  const clubXpGain = winnerId === userClub.id ? 400 : (homeScore === awayScore ? 200 : 100);
  userClub.xp = (userClub.xp || 0) + clubXpGain;

  // 2. Existing Injuries recovery check for user's club squad
  const clubPlayers = db.players.filter(p => p.club_id === userClub.id);
  clubPlayers.forEach(p => {
    if (p.injury_matches_remaining && p.injury_matches_remaining > 0) {
      p.injury_matches_remaining -= 1;
      if (p.injury_matches_remaining === 0) {
        p.status = 'active';
        p.injury_name = undefined;
        db.notifications.unshift({
          id: `notif-rec-${Date.now()}-${p.id}`,
          user_id: user.id,
          club_id: userClub.id,
          title: `✅ ¡Alta Médica: ${p.first_name} ${p.last_name}!`,
          message: `${p.first_name} ${p.last_name} se ha recuperado totalmente de su lesión y vuelve a estar disponible para jugar.`,
          type: 'match_alert',
          read: false,
          created_at: new Date().toISOString()
        });
      }
    }
  });

  // 3. Match Experience for active starters & Stats Improvement
  const xpPerPlayer = winnerId === userClub.id ? 150 : (homeScore === awayScore ? 100 : 70);
  const injuredNames: string[] = [];
  const improvedNames: string[] = [];

  clubPlayers.filter(p => p.is_starter && p.status === 'active').forEach(p => {
    p.matches_played = (p.matches_played || 0) + 1;
    p.xp = (p.xp || 0) + xpPerPlayer;

    // Check Player Improvement (Level-up / stat growth)
    // Every 300 XP (after ~2-3 matches), player improves +1 OVR up to potential
    if (p.xp >= 300 && p.rating < p.potential) {
      p.rating += 1;
      p.xp -= 300;
      const statKeys = ['pace', 'shooting', 'passing', 'dribbling', 'defense', 'physical'] as const;
      const randomStat = statKeys[Math.floor(Math.random() * statKeys.length)];
      if (p.stats && p.stats[randomStat] !== undefined) {
        p.stats[randomStat] = Math.min(99, p.stats[randomStat] + 1);
      }
      improvedNames.push(`${p.first_name} ${p.last_name} (+1 OVR -> ${p.rating})`);
    }

    // 4. Random Injury Roll (~12% chance per active player who played)
    if (Math.random() < 0.12) {
      const injuryDays = Math.random() > 0.5 ? 2 : 1; // 1-2 jornadas
      const injuryTypes = [
        'Sobrecarga muscular',
        'Esguince de tobillo leve',
        'Contusión en rodilla',
        'Contractura en gemelo',
        'Fatiga muscular aguda'
      ];
      const selectedInjury = injuryTypes[Math.floor(Math.random() * injuryTypes.length)];
      p.status = 'injured';
      p.injury_matches_remaining = injuryDays;
      p.injury_name = selectedInjury;
      p.is_starter = false; // Cannot start while injured
      injuredNames.push(`${p.first_name} ${p.last_name} (${selectedInjury}, ${injuryDays} jornada${injuryDays > 1 ? 's' : ''})`);

      db.notifications.unshift({
        id: `notif-inj-${Date.now()}-${p.id}`,
        user_id: user.id,
        club_id: userClub.id,
        title: `🏥 ¡Parte Médico: ${p.first_name} ${p.last_name}!`,
        message: `Sufrió ${selectedInjury} durante el partido. No estará disponible por ${injuryDays} jornada(s).`,
        type: 'match_alert',
        read: false,
        created_at: new Date().toISOString()
      });
    }
  });

  if (improvedNames.length > 0) {
    db.notifications.unshift({
      id: `notif-imp-${Date.now()}`,
      user_id: user.id,
      club_id: userClub.id,
      title: `📈 ¡Mejora de Jugadores por Experiencia!`,
      message: `Tus futbolistas han crecido tras el partido: ${improvedNames.join(', ')}.`,
      type: 'match_alert',
      read: false,
      created_at: new Date().toISOString()
    });
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
// SPONSORS & REPUTATION SYSTEM (Min 1200 Rep to be seen/offered)
// -------------------------------------------------------------
app.get('/api/sponsors/offers', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const userClub = db.clubs.find(c => c.id === user.club_id);
  if (!userClub) return res.status(400).json({ error: 'Club no encontrado' });

  // If reputation >= 1200 and no pending offers, randomly generate one if not at max capacity
  const maxSponsorsAllowed = Math.min(20, Math.max(1, (userClub.stadium_level || 0) * 2));
  const activeCount = userClub.active_sponsor_ids?.length || (userClub.active_sponsor_id ? 1 : 0);

  if ((userClub.reputation || 0) >= 1200 && db.sponsors && db.sponsors.length > 0) {
    const hasPending = db.sponsor_offers.some(o => o.club_id === userClub.id && o.status === 'pending');
    if (!hasPending && activeCount < maxSponsorsAllowed) {
      const available = db.sponsors.filter(s => 
        !userClub.active_sponsor_ids?.includes(s.id) && userClub.active_sponsor_id !== s.id
      );
      if (available.length > 0) {
        const sel = available[Math.floor(Math.random() * available.length)];
        const offer = {
          id: `spn-off-${Date.now()}`,
          club_id: userClub.id,
          sponsor_id: sel.id,
          sponsor_name: sel.name,
          sponsor_icon: sel.icon_url,
          category: sel.category,
          signing_bonus: sel.signing_bonus,
          match_bonus: sel.match_bonus,
          required_reputation: 1200,
          status: 'pending' as const,
          created_at: new Date().toISOString()
        };
        db.sponsor_offers.unshift(offer);
        dbManager.save();
      }
    }
  }

  const offers = db.sponsor_offers.filter(o => o.club_id === userClub.id);
  res.json({
    offers,
    reputation: userClub.reputation || 0,
    canBeSeen: (userClub.reputation || 0) >= 1200,
    activeCount,
    maxSponsorsAllowed
  });
});

app.post('/api/sponsors/offers/:id/accept', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const userClub = db.clubs.find(c => c.id === user.club_id);
  if (!userClub) return res.status(400).json({ error: 'Club no encontrado' });

  const offer = db.sponsor_offers.find(o => o.id === req.params.id && o.club_id === userClub.id);
  if (!offer) return res.status(404).json({ error: 'Oferta no encontrada' });
  if (offer.status !== 'pending') return res.status(400).json({ error: 'La oferta ya fue procesada' });

  if ((userClub.reputation || 0) < 1200) {
    return res.status(400).json({ error: 'Se requiere un mínimo de 1200 puntos de reputación para firmar patrocinios.' });
  }

  const maxSponsorsAllowed = Math.min(20, Math.max(1, (userClub.stadium_level || 0) * 2));
  if (!userClub.active_sponsor_ids) userClub.active_sponsor_ids = userClub.active_sponsor_id ? [userClub.active_sponsor_id] : [];

  if (userClub.active_sponsor_ids.length >= maxSponsorsAllowed) {
    return res.status(400).json({ 
      error: `Capacidad de patrocinadores agotada (${userClub.active_sponsor_ids.length}/${maxSponsorsAllowed}). Mejora tu estadio para desbloquear hasta 20 patrocinadores.` 
    });
  }

  offer.status = 'accepted';
  userClub.active_sponsor_ids.push(offer.sponsor_id);
  userClub.active_sponsor_id = offer.sponsor_id;

  // Pay signing bonus
  user.coins += offer.signing_bonus;
  db.coin_transactions.unshift({
    id: `tx-${Date.now()}`,
    user_id: user.id,
    amount: offer.signing_bonus,
    type: 'sponsor_signing',
    description: `Firma comercial oficial de patrocinio con ${offer.sponsor_name}`,
    created_at: new Date().toISOString()
  });

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: user.id,
    club_id: userClub.id,
    title: '¡Contrato de Patrocinio Firmado!',
    message: `Has cerrado exitosamente el patrocinio con ${offer.sponsor_name}. Se han ingresado ${offer.signing_bonus.toLocaleString()} monedas a las arcas del club.`,
    type: 'sponsor_offer',
    read: false,
    created_at: new Date().toISOString()
  });

  dbManager.save();
  res.json({ success: true, offer, userCoins: user.coins, club: userClub });
});

app.post('/api/sponsors/offers/:id/reject', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const userClub = db.clubs.find(c => c.id === user.club_id);
  if (!userClub) return res.status(400).json({ error: 'Club no encontrado' });

  const offer = db.sponsor_offers.find(o => o.id === req.params.id && o.club_id === userClub.id);
  if (!offer) return res.status(404).json({ error: 'Oferta no encontrada' });

  offer.status = 'rejected';
  dbManager.save();
  res.json({ success: true, offer });
});

// -------------------------------------------------------------
// STADIUM INFRASTRUCTURE (Level 0 to 10 - Monumental)
// -------------------------------------------------------------
const STADIUM_LEVELS = [
  { level: 0, name: 'Cancha Municipal', capacity: 2500, maxSponsors: 1, cost: 0, reqRep: 0, reqFans: 0, buildTimeSeconds: 0 },
  { level: 1, name: 'Graderío Básico', capacity: 6000, maxSponsors: 2, cost: 250000, reqRep: 500, reqFans: 10000, buildTimeSeconds: 60 },
  { level: 2, name: 'Estadio Regional', capacity: 14000, maxSponsors: 3, cost: 750000, reqRep: 700, reqFans: 50000, buildTimeSeconds: 180 },
  { level: 3, name: 'Arena Comunitaria', capacity: 24000, maxSponsors: 4, cost: 1800000, reqRep: 900, reqFans: 150000, buildTimeSeconds: 360 },
  { level: 4, name: 'Estadio Metropolitano', capacity: 38000, maxSponsors: 5, cost: 4500000, reqRep: 1050, reqFans: 500000, buildTimeSeconds: 720 },
  { level: 5, name: 'Parque Deportivo Nerva', capacity: 50000, maxSponsors: 7, cost: 8500000, reqRep: 1200, reqFans: 1200000, buildTimeSeconds: 1800 },
  { level: 6, name: 'Estadio Olímpico', capacity: 65000, maxSponsors: 9, cost: 14000000, reqRep: 1300, reqFans: 3000000, buildTimeSeconds: 3600 },
  { level: 7, name: 'La Catedral del Fútbol', capacity: 80000, maxSponsors: 12, cost: 22000000, reqRep: 1380, reqFans: 6500000, buildTimeSeconds: 7200 },
  { level: 8, name: 'Gran Coliseo', capacity: 95000, maxSponsors: 15, cost: 32000000, reqRep: 1430, reqFans: 11000000, buildTimeSeconds: 14400 },
  { level: 9, name: 'Superdomo Galáctico', capacity: 110000, maxSponsors: 17, cost: 42000000, reqRep: 1470, reqFans: 15000000, buildTimeSeconds: 28800 },
  { 
    level: 10, 
    name: 'MONUMENTAL', 
    capacity: 135000, 
    maxSponsors: 20, 
    cost: 50000000, // 50 Millones
    reqRep: 1500,     // 1500 Reputacion
    reqFans: 20000000,// 20 Millones Fans
    buildTimeSeconds: 14 * 86400 // 2 semanas (1,209,600 segundos)
  },
];

app.get('/api/stadium/info', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const userClub = db.clubs.find(c => c.id === user.club_id);
  if (!userClub) return res.status(400).json({ error: 'Club no encontrado' });

  const currentLevelNum = userClub.stadium_level || 0;
  const currentConfig = STADIUM_LEVELS.find(l => l.level === currentLevelNum) || STADIUM_LEVELS[0];
  const nextConfig = STADIUM_LEVELS.find(l => l.level === currentLevelNum + 1) || null;

  // Check if upgrade finished
  if (userClub.stadium_upgrading && userClub.stadium_upgrade_finishes_at) {
    if (Date.now() >= new Date(userClub.stadium_upgrade_finishes_at).getTime()) {
      userClub.stadium_upgrading = false;
      userClub.stadium_level = Math.min(10, currentLevelNum + 1);
      const upgradedConfig = STADIUM_LEVELS.find(l => l.level === userClub.stadium_level) || STADIUM_LEVELS[10];
      userClub.stadium_name = upgradedConfig.name;
      userClub.stadium_capacity = upgradedConfig.capacity;
      dbManager.save();
    }
  }

  res.json({
    club: userClub,
    currentLevel: currentConfig,
    nextLevel: nextConfig,
    allLevels: STADIUM_LEVELS,
    userCoins: user.coins
  });
});

app.post('/api/stadium/upgrade', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const userClub = db.clubs.find(c => c.id === user.club_id);
  if (!userClub) return res.status(400).json({ error: 'Club no encontrado' });

  const currentLevelNum = userClub.stadium_level || 0;
  if (currentLevelNum >= 10) {
    return res.status(400).json({ error: 'El estadio ya ha alcanzado el nivel máximo: MONUMENTAL' });
  }

  if (userClub.stadium_upgrading) {
    return res.status(400).json({ error: 'El estadio ya se encuentra en obras de ampliación' });
  }

  const nextConfig = STADIUM_LEVELS.find(l => l.level === currentLevelNum + 1);
  if (!nextConfig) return res.status(400).json({ error: 'Nivel no disponible' });

  // Validate requirements
  if (nextConfig.level === 10 && (userClub.level || 0) < 80) {
    return res.status(400).json({ 
      error: `🔒 ¡Acceso Bloqueado! Para construir el Estadio Monumental debes alcanzar el Nivel 80 de Club. (Tu nivel actual es ${userClub.level || 0}/80). Sigue ganando partidos y acumulando afición.` 
    });
  }

  if (user.coins < nextConfig.cost) {
    return res.status(400).json({ error: `Fondos insuficientes. Se requieren ${nextConfig.cost.toLocaleString()} monedas.` });
  }
  if ((userClub.reputation || 0) < nextConfig.reqRep) {
    return res.status(400).json({ error: `Reputación insuficiente. Se requieren ${nextConfig.reqRep} puntos (tienes ${userClub.reputation || 0}).` });
  }
  if ((userClub.fans || 0) < nextConfig.reqFans) {
    return res.status(400).json({ error: `Seguidores insuficientes. Se requieren ${nextConfig.reqFans.toLocaleString()} fans (tienes ${(userClub.fans || 0).toLocaleString()}).` });
  }

  // Deduct cost
  user.coins -= nextConfig.cost;
  db.coin_transactions.unshift({
    id: `tx-${Date.now()}`,
    user_id: user.id,
    amount: -nextConfig.cost,
    type: 'stadium_upgrade',
    description: `Inicio de obras para el estadio ${nextConfig.name} (Nivel ${nextConfig.level})`,
    created_at: new Date().toISOString()
  });

  const finishesAt = new Date(Date.now() + nextConfig.buildTimeSeconds * 1000).toISOString();
  userClub.stadium_upgrading = true;
  userClub.stadium_upgrade_finishes_at = finishesAt;

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: user.id,
    club_id: userClub.id,
    title: `¡Obras Iniciadas: ${nextConfig.name}!`,
    message: `Se han puesto en marcha las obras para alcanzar el nivel ${nextConfig.level}. Capacidad final: ${nextConfig.capacity.toLocaleString()} y hasta ${nextConfig.maxSponsors} patrocinadores.`,
    type: 'stadium',
    read: false,
    created_at: new Date().toISOString()
  });

  dbManager.save();
  res.json({
    success: true,
    finishesAt,
    club: userClub,
    userCoins: user.coins
  });
});

app.post('/api/stadium/claim-upgrade', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const userClub = db.clubs.find(c => c.id === user.club_id);
  if (!userClub) return res.status(400).json({ error: 'Club no encontrado' });

  if (!userClub.stadium_upgrading || !userClub.stadium_upgrade_finishes_at) {
    return res.status(400).json({ error: 'No hay ninguna obra activa para finalizar' });
  }

  const remaining = new Date(userClub.stadium_upgrade_finishes_at).getTime() - Date.now();
  if (remaining > 0) {
    return res.status(400).json({ 
      error: `La construcción sigue en curso. Faltan ${Math.ceil(remaining / 1000 / 60)} minutos.` 
    });
  }

  userClub.stadium_upgrading = false;
  userClub.stadium_level = Math.min(10, (userClub.stadium_level || 0) + 1);
  const conf = STADIUM_LEVELS.find(l => l.level === userClub.stadium_level) || STADIUM_LEVELS[10];
  userClub.stadium_name = conf.name;
  userClub.stadium_capacity = conf.capacity;

  dbManager.save();
  res.json({ success: true, club: userClub });
});

// CLUB 80-LEVEL PROGRESSION SYSTEM
app.post('/api/club/level-up', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const club = db.clubs.find(c => c.id === user.club_id);
  if (!club) return res.status(404).json({ error: 'Club no encontrado' });

  const currentLevel = club.level || 0;
  if (currentLevel >= 80) {
    return res.status(400).json({ error: 'Tu club ya ha alcanzado el nivel máximo legendario: NIVEL 80' });
  }

  const targetLevel = currentLevel + 1;
  const xp_required = Math.round(15 * Math.pow(targetLevel, 1.95));
  const reputation_required = 1000 + Math.round(targetLevel * 80);
  const matches_won_required = Math.max(1, Math.round(targetLevel * 0.95));
  const fans_required = Math.round(200 * Math.pow(targetLevel, 1.8));

  const currentXp = club.xp || 0;
  const currentRep = club.reputation || 1000;
  const currentWins = club.matches_won || 0;
  const currentFans = club.fans || 0;

  if (currentXp < xp_required) {
    return res.status(400).json({ error: `Falta Experiencia: tienes ${currentXp.toLocaleString()} XP y se requieren ${xp_required.toLocaleString()} XP.` });
  }
  if (currentRep < reputation_required) {
    return res.status(400).json({ error: `Falta Reputación: tienes ${currentRep} pts y se requieren ${reputation_required} pts.` });
  }
  if (currentWins < matches_won_required) {
    return res.status(400).json({ error: `Faltan Victorias: tienes ${currentWins} y se requieren ${matches_won_required} victorias oficiales.` });
  }
  if (currentFans < fans_required) {
    return res.status(400).json({ error: `Falta Afición: tienes ${currentFans.toLocaleString()} y se requieren ${fans_required.toLocaleString()} fans.` });
  }

  // Promote level
  club.level = targetLevel;
  const rewardCoins = Math.round(10000 + targetLevel * 60000);
  user.coins += rewardCoins;

  db.coin_transactions.unshift({
    id: `tx-${Date.now()}`,
    user_id: user.id,
    amount: rewardCoins,
    type: 'admin_grant',
    description: `Recompensa por ascender al Nivel de Club ${targetLevel}`,
    created_at: new Date().toISOString()
  });

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: user.id,
    club_id: club.id,
    title: `🎉 ¡Club ascendió al Nivel ${targetLevel}!`,
    message: `Has superado todos los requisitos. Recompensa: +${rewardCoins.toLocaleString()} monedas.${targetLevel === 80 ? ' 🏟️ ¡CONSTRUCCIÓN DEL ESTADIO MONUMENTAL DESBLOQUEADA!' : ''}`,
    type: 'level',
    read: false,
    created_at: new Date().toISOString()
  });

  dbManager.save();
  res.json({
    success: true,
    club,
    userCoins: user.coins,
    message: `¡Felicitaciones! Tu club ha alcanzado el Nivel ${targetLevel}. Recibes +${rewardCoins.toLocaleString()} monedas.${targetLevel === 80 ? ' ¡El Estadio Monumental ha sido desbloqueado!' : ''}`
  });
});

// -------------------------------------------------------------
// CLUB SOCIAL MEDIA (NERVA Social / Fans - Max 8 Billones)
// -------------------------------------------------------------
app.get('/api/social/posts', (_req: Request, res: Response) => {
  const now = Date.now();
  const postsWithDynamicGrowth = (db.club_posts || []).map(post => {
    const elapsedMs = now - new Date(post.created_at).getTime();
    const tenMinutesMs = 10 * 60 * 1000;
    const postClub = db.clubs.find(c => c.id === post.club_id);
    const rep = postClub?.reputation || 1000;

    if (elapsedMs < tenMinutesMs) {
      // First 10 minutes: 0 new fans gained
      const minutesLeft = Math.ceil((tenMinutesMs - elapsedMs) / 60000);
      return {
        ...post,
        fans_gained: 0,
        is_active_growth: false,
        status_text: `Primeros minutos (0 nuevos fans) · El impacto de afición aumentará en ${minutesLeft} min según reputación (${rep} pts)`
      };
    } else {
      // 10 minutes and beyond: fans increase progressively based on reputation
      const minutesOver = Math.floor((elapsedMs - tenMinutesMs) / 60000) + 1;
      const ratePerMinute = Math.floor((rep / 1000) * 180) + 25;
      const calculatedFans = Math.min(25000000, minutesOver * ratePerMinute);
      
      return {
        ...post,
        fans_gained: calculatedFans,
        is_active_growth: true,
        status_text: `🔥 Creciendo según reputación (${rep} pts): +${calculatedFans.toLocaleString()} nuevos aficionados acumulados tras ${Math.floor(elapsedMs / 60000)} min`
      };
    }
  });

  res.json({ posts: postsWithDynamicGrowth });
});

app.post('/api/social/posts', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const userClub = db.clubs.find(c => c.id === user.club_id);
  if (!userClub) return res.status(400).json({ error: 'Club no encontrado' });

  const { title, content, type, image_url } = req.body;
  if (!content) return res.status(400).json({ error: 'El contenido de la publicación no puede estar vacío' });

  const newPost = {
    id: `post-${Date.now()}`,
    club_id: userClub.id,
    club_name: userClub.name,
    club_crest: userClub.crest_url,
    type: type || 'statement',
    title: title || 'Comunicado Oficial',
    content,
    image_url: image_url || null,
    likes: 0, // Starts at 0
    fans_gained: 0, // In the first 10 minutes starts at 0!
    created_at: new Date().toISOString()
  };

  db.club_posts.unshift(newPost);
  dbManager.save();
  res.json({ post: newPost, fans: userClub.fans });
});

app.post('/api/social/posts/:id/like', (req: Request, res: Response) => {
  const post = db.club_posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Publicación no encontrada' });
  post.likes = (post.likes || 0) + 1;
  dbManager.save();
  res.json({ success: true, likes: post.likes });
});

// -------------------------------------------------------------
// NOTIFICATIONS SYSTEM
// -------------------------------------------------------------
app.get('/api/notifications', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const notifs = db.notifications.filter(n => n.user_id === user.id || n.club_id === user.club_id);
  res.json({ notifications: notifs });
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  const notif = db.notifications.find(n => n.id === req.params.id);
  if (notif) notif.read = true;
  dbManager.save();
  res.json({ success: true });
});

app.delete('/api/notifications/:id', (req: Request, res: Response) => {
  db.notifications = db.notifications.filter(n => n.id !== req.params.id);
  dbManager.save();
  res.json({ success: true });
});

// -------------------------------------------------------------
// BACKGROUND AUDIO & MUSIC
// -------------------------------------------------------------
app.get('/api/audio/tracks', (_req: Request, res: Response) => {
  res.json({ tracks: db.background_tracks || [] });
});

app.post('/api/audio/upload', (req: Request, res: Response) => {
  const { title, artist, url, dataUrl } = req.body;
  let trackUrl = url;

  if (dataUrl) {
    try {
      const audioDir = path.resolve(process.cwd(), 'public', 'uploads', 'audio');
      if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

      const matches = String(dataUrl).match(/^data:audio\/([A-Za-z0-9-+]+);base64,(.+)$/);
      if (matches && matches[2]) {
        const ext = matches[1] || 'mp3';
        const safeName = `audio-${Date.now()}.${ext}`;
        const filePath = path.join(audioDir, safeName);
        fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));
        trackUrl = `/uploads/audio/${safeName}`;
      } else {
        trackUrl = dataUrl;
      }
    } catch (err) {
      console.error('Audio upload error:', err);
      return res.status(500).json({ error: 'Error al procesar el archivo de audio' });
    }
  }

  if (!trackUrl) return res.status(400).json({ error: 'No se proporcionó URL o archivo de audio' });

  const newTrack = {
    id: `trk-${Date.now()}`,
    title: title || 'Pista de Audio Subida',
    artist: artist || 'Mánager Nerva',
    url: trackUrl,
    is_active: true
  };

  db.background_tracks.forEach(t => t.is_active = false);
  db.background_tracks.unshift(newTrack);
  dbManager.save();
  res.json({ success: true, track: newTrack });
});

app.post('/api/audio/tracks/:id/activate', (req: Request, res: Response) => {
  const track = db.background_tracks.find(t => t.id === req.params.id);
  if (!track) return res.status(404).json({ error: 'Pista no encontrada' });

  db.background_tracks.forEach(t => t.is_active = (t.id === track.id));
  dbManager.save();
  res.json({ success: true, activeTrack: track });
});

// -------------------------------------------------------------
// ADMIN ACTIONS & SECRET ROOT ROUTE (/directorioraizdenuestraygrandisimaownerv2)
// -------------------------------------------------------------
app.get('/api/admin/full-data', (_req: Request, res: Response) => {
  res.json({
    profiles: db.profiles,
    clubs: db.clubs,
    players: db.players,
    matches: db.matches,
    sponsors: db.sponsors,
    tracks: db.background_tracks,
    posts: db.club_posts,
    notifications: db.notifications
  });
});

// Real Delete Endpoint (Fixes: "En panel admin no funciona boton de borrar")
app.post('/api/admin/delete', (req: Request, res: Response) => {
  const { type, id } = req.body;
  if (!type || !id) return res.status(400).json({ error: 'Tipo e ID son requeridos' });

  let deleted = false;
  if (type === 'player') {
    const idx = db.players.findIndex(p => p.id === id);
    if (idx !== -1) { db.players.splice(idx, 1); deleted = true; }
  } else if (type === 'club') {
    const idx = db.clubs.findIndex(c => c.id === id);
    if (idx !== -1) { db.clubs.splice(idx, 1); deleted = true; }
  } else if (type === 'user' || type === 'profile') {
    const idx = db.profiles.findIndex(p => p.id === id);
    if (idx !== -1) { db.profiles.splice(idx, 1); deleted = true; }
  } else if (type === 'post') {
    const idx = db.club_posts.findIndex(p => p.id === id);
    if (idx !== -1) { db.club_posts.splice(idx, 1); deleted = true; }
  } else if (type === 'track') {
    const idx = db.background_tracks.findIndex(t => t.id === id);
    if (idx !== -1) { db.background_tracks.splice(idx, 1); deleted = true; }
  }

  if (!deleted) {
    return res.status(404).json({ error: 'Elemento no encontrado para eliminar' });
  }

  dbManager.save();
  res.json({ success: true, message: `Elemento ${type} con ID ${id} eliminado correctamente.` });
});

// AI Player Image Generation
app.post('/api/admin/generate-player-image', (req: Request, res: Response) => {
  const { playerId, position, nationality } = req.body;
  const player = db.players.find(p => p.id === playerId);
  if (!player) return res.status(404).json({ error: 'Jugador no encontrado' });

  // Curated professional realistic football player faces/avatars
  const athleticFaces = [
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80'
  ];

  const selectedAvatar = athleticFaces[Math.floor(Math.random() * athleticFaces.length)];
  player.avatar_url = selectedAvatar;
  dbManager.save();

  res.json({
    success: true,
    player,
    imageUrl: selectedAvatar,
    message: `Imagen de jugador generada y asignada exitosamente con IA.`
  });
});

// Admin Club Management
app.put('/api/admin/clubs/:id', requireAdmin, (req: Request, res: Response) => {
  const club = db.clubs.find(c => c.id === req.params.id);
  if (!club) return res.status(404).json({ error: 'Club no encontrado' });

  const { name, crest_url, stadium_level, reputation, fans, budget, formation } = req.body;
  if (name) club.name = name;
  if (crest_url) club.crest_url = crest_url;
  if (stadium_level !== undefined) {
    club.stadium_level = Number(stadium_level);
    const sConf = STADIUM_LEVELS.find(l => l.level === club.stadium_level) || STADIUM_LEVELS[0];
    club.stadium_name = sConf.name;
    club.stadium_capacity = sConf.capacity;
  }
  if (reputation !== undefined) club.reputation = Number(reputation);
  if (fans !== undefined) club.fans = Math.min(8000000000, Number(fans));
  if (budget !== undefined) club.budget = Number(budget);
  if (formation) club.formation = formation;

  // Sync standing
  const standing = db.standings.find(s => s.club_id === club.id);
  if (standing) {
    standing.club_name = club.name;
    standing.crest_url = club.crest_url;
  }

  dbManager.save();
  res.json({ success: true, club });
});

app.delete('/api/admin/clubs/:id', requireAdmin, (req: Request, res: Response) => {
  const idx = db.clubs.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Club no encontrado' });

  const removed = db.clubs.splice(idx, 1)[0];
  db.standings = db.standings.filter(s => s.club_id !== req.params.id);
  // Free players from this club
  db.players.forEach(p => {
    if (p.club_id === req.params.id) {
      p.club_id = null;
      p.club_name = 'Agente Libre';
    }
  });

  dbManager.save();
  res.json({ success: true, message: `Club ${removed.name} eliminado.` });
});

// Admin User Delete
app.delete('/api/admin/users/:id', requireAdmin, (req: Request, res: Response) => {
  const admin = getSessionUser(req);
  if (req.params.id === admin.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador' });
  }

  const idx = db.profiles.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });

  const removed = db.profiles.splice(idx, 1)[0];
  dbManager.save();
  res.json({ success: true, message: `Usuario @${removed.username} eliminado.` });
});

// -------------------------------------------------------------
// 7. CODES & OWNER ELEVATION
// -------------------------------------------------------------
app.post('/api/codes/redeem', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  const rawCode = (req.body.code || '').trim();
  const normalized = rawCode.replace(/\s+/g, '').toUpperCase();

  // A. SECRET OWNER ELEVATION CODE: "iamnevulex"
  // Per User Request: Login a administración en el canje con el código: "iamnevulex" y se activará en la cuenta
  if (rawCode.toLowerCase() === 'iamnevulex') {
    user.role = 'owner';
    user.coins += 5000000;
    user.premium_active = true;
    user.premium_expires_at = new Date(Date.now() + 365 * 86400000).toISOString(); // 1 year VIP
    dbManager.save();
    return res.json({
      success: true,
      message: '¡AUTORIZACIÓN SUPREMA ACTIVADA! Has canjeado el código "iamnevulex". Se ha asignado el rol de ADMINISTRADOR SUPREMO (OWNER) a tu cuenta con 5.000.000 monedas y acceso total al panel.',
      user,
      isAdminElevated: true
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

app.put('/api/admin/leagues/:id', requireAdmin, (req: Request, res: Response) => {
  const league = db.leagues.find(l => l.id === req.params.id);
  if (!league) return res.status(404).json({ error: 'Liga no encontrada' });
  Object.assign(league, req.body);
  dbManager.save();
  res.json({ success: true, league });
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

app.put('/api/admin/sponsors/:id', requireAdmin, (req: Request, res: Response) => {
  const sponsor = db.sponsors.find(s => s.id === req.params.id);
  if (!sponsor) return res.status(404).json({ error: 'Patrocinador no encontrado' });
  Object.assign(sponsor, req.body);
  dbManager.save();
  res.json({ success: true, sponsor });
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

app.put('/api/admin/trophies/:id', requireAdmin, (req: Request, res: Response) => {
  const trophy = db.trophies.find(t => t.id === req.params.id);
  if (!trophy) return res.status(404).json({ error: 'Trofeo no encontrado' });
  Object.assign(trophy, req.body);
  dbManager.save();
  res.json({ success: true, trophy });
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

    // Handle SPA HTML routes in development
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/uploads')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } else {
          next();
        }
      } catch (e: any) {
        if (vite) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
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
