import { 
  Profile, Club, Player, League, Standing, Match, 
  TransferListing, Auction, Trophy, Achievement, 
  CosmeticItem, AppSettings 
} from '../types/index.ts';

const TOKEN_KEY = 'nerva_auth_token';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(endpoint, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Ha ocurrido un error en el servidor');
  }

  return data as T;
}

export const api = {
  // Auth
  async getMe() {
    return request<{ user: Profile; club: Club | null }>('/api/auth/me');
  },
  async login(username: string) {
    const res = await request<{ user: Profile; club: Club | null; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    localStorage.setItem(TOKEN_KEY, res.token);
    return res;
  },
  async register(username: string, display_name: string, club_name?: string) {
    const res = await request<{ user: Profile; club: Club; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, display_name, club_name }),
    });
    localStorage.setItem(TOKEN_KEY, res.token);
    return res;
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
  },
  async updateProfile(
    dataOrName?: string | { display_name?: string; avatar_url?: string; theme_color?: string; bio?: string; nationality?: string; tactical_style?: string },
    avatar_url?: string,
    theme_color?: string
  ) {
    const payload = typeof dataOrName === 'object' && dataOrName !== null
      ? dataOrName
      : { display_name: dataOrName, avatar_url, theme_color };

    return request<{ user: Profile }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async uploadImage(dataUrl: string, filename?: string) {
    return request<{ url: string; success: boolean }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ dataUrl, filename }),
    });
  },

  // Sponsors
  async getSponsors() {
    return request<{ sponsors: any[] }>('/api/sponsors');
  },
  async signSponsor(sponsor_id: string) {
    return request<{ success: boolean; club: Club; sponsor: any; coins: number }>('/api/clubs/sign-sponsor', {
      method: 'POST',
      body: JSON.stringify({ sponsor_id }),
    });
  },

  // Clubs & Squad
  async getMyClub() {
    return request<{ club: Club; squad: Player[] }>('/api/clubs/my');
  },
  async updateMyClub(data: Partial<Club>) {
    return request<{ club: Club }>('/api/clubs/my', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async updatePlayerLineup(playerId: string, is_starter: boolean) {
    return request<{ player: Player }>(`/api/players/${playerId}/lineup`, {
      method: 'PUT',
      body: JSON.stringify({ is_starter }),
    });
  },

  // Transfer Market
  async getMarketListings() {
    return request<{ listings: TransferListing[] }>('/api/market/listings');
  },
  async listPlayerOnMarket(player_id: string, asking_price: number) {
    return request<{ listing: TransferListing }>('/api/market/list-player', {
      method: 'POST',
      body: JSON.stringify({ player_id, asking_price }),
    });
  },
  async buyPlayer(listing_id: string) {
    return request<{ success: boolean; player: Player; coins: number }>('/api/market/buy', {
      method: 'POST',
      body: JSON.stringify({ listing_id }),
    });
  },

  // Auctions
  async getAuctions() {
    return request<{ auctions: Auction[] }>('/api/auctions');
  },
  async placeBid(auction_id: string, bid_amount: number) {
    return request<{ success: boolean; auction: Auction; userCoins: number }>('/api/auctions/bid', {
      method: 'POST',
      body: JSON.stringify({ auction_id, bid_amount }),
    });
  },

  // Leagues & Matches
  async getLeagues() {
    return request<{ leagues: League[] }>('/api/leagues');
  },
  async getLeagueStandings(league_id: string) {
    return request<{ standings: Standing[] }>(`/api/leagues/${league_id}/standings`);
  },
  async getLeagueMatches(league_id: string) {
    return request<{ matches: Match[] }>(`/api/leagues/${league_id}/matches`);
  },
  async simulateMatch() {
    return request<{ match: Match; rewardCoins: number; userCoins: number; userClub: Club }>('/api/matches/simulate', {
      method: 'POST',
    });
  },
  async getDailyMatches() {
    return request<{ matches: (Match & { current_elapsed_seconds: number; current_live_minute: number; server_now: number })[]; server_now: number; club: Club }>('/api/matches/daily');
  },
  async updateMatchTactics(match_id: string, mentality: string, formation?: string) {
    return request<{ success: boolean; match: Match }>(`/api/matches/${match_id}/tactics`, {
      method: 'POST',
      body: JSON.stringify({ mentality, formation }),
    });
  },
  async scheduleInstantMatch() {
    return request<{ success: boolean; match: Match }>('/api/matches/schedule-instant', {
      method: 'POST',
    });
  },

  // Codes & Premium
  async redeemCode(code: string) {
    return request<{ success: boolean; message: string; coins?: number; user?: Profile }>('/api/codes/redeem', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },
  async claimPremium(code: string) {
    return request<{ success: boolean; message: string; premium_expires_at: string }>('/api/premium/claim', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  // Trophies, Achievements, Cosmetics
  async getTrophies() {
    return request<{ trophies: Trophy[] }>('/api/trophies');
  },
  async getAchievements() {
    return request<{ achievements: Achievement[] }>('/api/achievements');
  },
  async getCosmetics() {
    return request<{ cosmetics: CosmeticItem[] }>('/api/cosmetics');
  },
  async getCoinTransactions() {
    return request<{ transactions: any[] }>('/api/history/transactions');
  },

  // Labs (Admin Panel)
  async getAdminMetrics() {
    return request<{ metrics: any }>('/api/admin/metrics');
  },
  async getAdminUsers() {
    return request<{ users: Profile[] }>('/api/admin/users');
  },
  async updateUserRole(id: string, data: { role?: string; status?: string; coins?: number }) {
    return request<{ user: Profile }>(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async createAdminPlayer(playerData: any) {
    return request<{ player: Player }>('/api/admin/players', {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
  },
  async updateAdminPlayer(id: string, playerData: any) {
    return request<{ player: Player }>(`/api/admin/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(playerData),
    });
  },
  async deleteAdminPlayer(id: string) {
    return request<{ success: boolean }>(`/api/admin/players/${id}`, {
      method: 'DELETE',
    });
  },
  async createAdminLeague(leagueData: any) {
    return request<{ league: League }>('/api/admin/leagues', {
      method: 'POST',
      body: JSON.stringify(leagueData),
    });
  },
  async deleteAdminLeague(id: string) {
    return request<{ success: boolean }>(`/api/admin/leagues/${id}`, {
      method: 'DELETE',
    });
  },
  // Admin Sponsors
  async getAdminSponsors() {
    return request<{ sponsors: any[] }>('/api/admin/sponsors');
  },
  async createAdminSponsor(data: any) {
    return request<{ sponsor: any }>('/api/admin/sponsors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async deleteAdminSponsor(id: string) {
    return request<{ success: boolean }>(`/api/admin/sponsors/${id}`, {
      method: 'DELETE',
    });
  },
  // Admin Trophies
  async createAdminTrophy(data: any) {
    return request<{ trophy: any }>('/api/admin/trophies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async deleteAdminTrophy(id: string) {
    return request<{ success: boolean }>(`/api/admin/trophies/${id}`, {
      method: 'DELETE',
    });
  },
  // Admin Codes
  async getAdminCodes() {
    return request<{ reward_codes: any[]; premium_codes: any[] }>('/api/admin/codes');
  },
  async createAdminCode(codeData: any) {
    return request<any>('/api/admin/codes', {
      method: 'POST',
      body: JSON.stringify(codeData),
    });
  },
  async deleteAdminCode(id: string) {
    return request<{ success: boolean }>(`/api/admin/codes/${id}`, {
      method: 'DELETE',
    });
  },
  async getAppSettings() {
    return request<{ settings: AppSettings }>('/api/admin/settings');
  },
  async updateAppSettings(data: Partial<AppSettings>) {
    return request<{ settings: AppSettings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
};
