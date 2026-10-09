import type {
  User,
  PredictionPost,
  ChatMessage,
  BookingCode,
  MarketplaceItem,
  SportsMatch,
  LeagueStanding,
  MatchAnalysis,
  FriendRequest,
} from '../types';

const TOKEN_KEY = 'safepicks_token';

export const api = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token: string | null) {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) {
      console.error('Storage error:', e);
    }
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers = new Headers(options.headers || {});

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = { error: 'Failed to parse response' };
    }

    if (!res.ok) {
      const errorMsg = data?.error || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  },

  // Auth
  async register(body: { email: string; password: string; username: string; displayName?: string; favoriteTeam?: string }) {
    return this.request<{ token: string; user: User; verificationCodeHint?: string; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async login(body: { email: string; password: string }) {
    return this.request<{ token: string; user: User; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async getMe() {
    return this.request<{ user: User | null }>('/api/auth/me');
  },

  async verifyEmail(code: string) {
    return this.request<{ message: string; user: User }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  async resendVerification() {
    return this.request<{ message: string; verificationCodeHint?: string }>('/api/auth/resend-verification', {
      method: 'POST',
    });
  },

  async forgotPassword(email: string) {
    return this.request<{ message: string; resetCodeHint?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(body: { email: string; code: string; newPassword: string }) {
    return this.request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async logout() {
    try {
      await this.request<{ message: string }>('/api/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  },

  async updateProfile(body: { displayName?: string; bio?: string; favoriteTeam?: string; avatarColor?: string }) {
    return this.request<{ user: User; message: string }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  async heartbeat() {
    return this.request<{ onlineUsers: number }>('/api/auth/heartbeat', { method: 'POST' });
  },

  async getUserProfile(userId: string) {
    return this.request<{ user: User & { isOnline: boolean } }>(`/api/users/${userId}`);
  },

  // Predictions
  async getPredictions() {
    return this.request<{ predictions: PredictionPost[] }>('/api/predictions');
  },

  async createPrediction(body: Partial<PredictionPost>) {
    return this.request<{ prediction: PredictionPost; message: string }>('/api/admin/predictions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updatePrediction(id: string, body: Partial<PredictionPost>) {
    return this.request<{ prediction: PredictionPost; message: string }>(`/api/admin/predictions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async togglePinPrediction(id: string) {
    return this.request<{ prediction: PredictionPost }>(`/api/admin/predictions/${id}/pin`, {
      method: 'PATCH',
    });
  },

  async deletePrediction(id: string) {
    return this.request<{ message: string }>(`/api/admin/predictions/${id}`, {
      method: 'DELETE',
    });
  },

  // Chat
  async getMessages(limit = 100) {
    return this.request<{ messages: ChatMessage[] }>(`/api/chat/messages?limit=${limit}`);
  },

  async sendMessage(content: string) {
    return this.request<{ message: ChatMessage }>('/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async reactToMessage(id: string, emoji: string) {
    return this.request<{ reactions: Record<string, string[]> }>(`/api/chat/messages/${id}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  },

  async reportMessage(id: string, reason: string) {
    return this.request<{ message: string; reportId: string }>(`/api/chat/messages/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async blockUser(targetUserId: string) {
    return this.request<{ message: string }>('/api/users/block', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  },

  async unblockUser(targetUserId: string) {
    return this.request<{ message: string }>('/api/users/unblock', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  },

  // Direct Chat & Friends
  async getDirectMessages(recipientId: string) {
    return this.request<{ messages: ChatMessage[] }>(`/api/chat/direct/${recipientId}`);
  },

  async sendDirectMessage(recipientId: string, content: string) {
    return this.request<{ message: ChatMessage }>(`/api/chat/direct/${recipientId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async getFriends() {
    return this.request<{ friends: User[]; requests: FriendRequest[] }>('/api/friends');
  },

  async sendFriendRequest(toUserId: string) {
    return this.request<{ request: FriendRequest; message: string }>('/api/friends/request', {
      method: 'POST',
      body: JSON.stringify({ toUserId }),
    });
  },

  async respondFriendRequest(requestId: string, status: 'accepted' | 'declined') {
    return this.request<{ request: FriendRequest; message: string }>('/api/friends/respond', {
      method: 'POST',
      body: JSON.stringify({ requestId, status }),
    });
  },

  async removeFriend(friendId: string) {
    return this.request<{ success: boolean; message: string }>(`/api/friends/${friendId}`, {
      method: 'DELETE',
    });
  },

  // Spaces Booking Codes
  async getBookingCodes(platform: string) {
    return this.request<{ codes: BookingCode[] }>(`/api/spaces/${platform}/codes`);
  },

  async createBookingCode(platform: string, body: { code: string; title: string; odds: number; matchCount: number; stakeTip?: string }) {
    return this.request<{ code: BookingCode }>(`/api/spaces/${platform}/codes`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async copyBookingCode(id: string) {
    return this.request<{ copyCount: number }>(`/api/spaces/codes/${id}/copy`, {
      method: 'POST',
    });
  },

  // Sports & Analysis
  async getLeagues() {
    return this.request<{ leagues: { id: string; code: string; name: string; country: string }[] }>('/api/sports/leagues');
  },

  async getFixtures(leagueId = '4328') {
    return this.request<{ matches: SportsMatch[]; source: string; lastUpdated: string }>(`/api/sports/fixtures?leagueId=${leagueId}`);
  },

  async getStandings(leagueId = '4328') {
    return this.request<{ standings: LeagueStanding[]; source: string }>(`/api/sports/standings?leagueId=${leagueId}`);
  },

  async getMatchAnalysis(matchId: string, leagueId = '4328') {
    return this.request<{ analysis: MatchAnalysis }>(`/api/sports/analysis/${matchId}?leagueId=${leagueId}`);
  },

  // Marketplace
  async getMarketplace(category?: string, search?: string) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    return this.request<{ items: MarketplaceItem[] }>(`/api/marketplace/items?${params.toString()}`);
  },

  async createMarketplaceItem(body: Partial<MarketplaceItem>) {
    return this.request<{ item: MarketplaceItem; message: string }>('/api/marketplace/items', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async deleteMarketplaceItem(id: string) {
    return this.request<{ message: string }>(`/api/marketplace/items/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin
  async getAdminReports() {
    return this.request<{ reports: unknown[] }>('/api/admin/reports');
  },

  async resolveAdminReport(id: string, status: 'reviewed' | 'dismissed') {
    return this.request<{ report: unknown }>(`/api/admin/reports/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  async getAdminUsers() {
    return this.request<{ users: User[] }>('/api/admin/users');
  },

  async updateAdminUser(id: string, body: { role?: 'admin' | 'user'; isBanned?: boolean }) {
    return this.request<{ user: User; message: string }>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  // System Health
  async getSystemHealth() {
    return this.request<{
      status: string;
      platform: string;
      nodeVersion: string;
      memoryUsageMb: number;
      activeSseSubscribers: number;
      databaseStats: {
        totalUsers: number;
        activeUsers: number;
        totalPredictions: number;
        totalMessages: number;
        totalBookingCodes: number;
        totalMarketplaceItems: number;
        uptimeSeconds: number;
      };
      scalabilityTier: string;
      timestamp: string;
    }>('/api/system/health');
  },
};
