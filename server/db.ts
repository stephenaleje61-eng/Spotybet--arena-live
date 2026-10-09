import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  User,
  Session,
  PredictionPost,
  ChatMessage,
  FriendRequest,
  BookingCode,
  MarketplaceItem,
  ChatReport,
} from './types.js';

interface DatabaseSchema {
  users: User[];
  sessions: Session[];
  predictions: PredictionPost[];
  messages: ChatMessage[];
  directMessages: ChatMessage[];
  friendRequests: FriendRequest[];
  bookingCodes: BookingCode[];
  marketplace: MarketplaceItem[];
  reports: ChatReport[];
  blocks: { userId: string; blockedUserId: string; createdAt: string }[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'safepicks_db.json');

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function initialSeed(): DatabaseSchema {
  const adminSalt = crypto.randomBytes(16).toString('hex');
  const adminHash = hashPassword('AdminSafePicks2026!', adminSalt);
  const now = new Date().toISOString();

  // Admin account for the logged in user johnlsacc23332@gmail.com
  const adminUser: User = {
    id: 'user_admin_01',
    email: 'johnlsacc23332@gmail.com',
    username: 'john_admin',
    displayName: 'Chief Analyst John',
    passwordHash: adminHash,
    salt: adminSalt,
    role: 'admin',
    isEmailVerified: true,
    avatarColor: '#EAB308',
    bio: 'Lead Sports Data Modeler & Administrator at Safe Picks Arena. Analyzing mathematical football probabilities since 2018.',
    favoriteTeam: 'Real Madrid',
    createdAt: now,
    lastActiveAt: now,
  };

  const initialPredictions: PredictionPost[] = [
    {
      id: 'pred_001',
      title: 'Arsenal vs Manchester City - High Stakes Title Clash',
      league: 'English Premier League',
      homeTeam: 'Arsenal',
      awayTeam: 'Manchester City',
      kickoffTime: new Date(Date.now() + 86400000 * 2).toISOString(),
      predictionTip: 'Both Teams to Score & Over 2.5 Goals',
      marketType: 'BTTS',
      odds: 1.88,
      confidenceScore: 84,
      analysis: 'Arsenal have scored in 14 of their last 15 home fixtures (xG 2.14). Manchester City average 2.45 goals on the road but have conceded in 4 consecutive away games. Model indicates a 68% probability for BTTS with high offensive output expected.',
      isPinned: true,
      status: 'upcoming',
      authorId: adminUser.id,
      authorName: adminUser.displayName,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      tags: ['Premier League', 'Top Pick', 'BTTS', 'xG Advantage'],
    },
    {
      id: 'pred_002',
      title: 'Real Madrid vs Barcelona - El Clasico Tactical Breakdown',
      league: 'Spanish La Liga',
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      kickoffTime: new Date(Date.now() + 86400000 * 3).toISOString(),
      predictionTip: 'Real Madrid Win or Draw (1X) & Over 1.5 Goals',
      marketType: 'Double Chance',
      odds: 1.72,
      confidenceScore: 88,
      analysis: 'Real Madrid unbeaten at the Bernabeu in their last 18 outings across all competitions. Barcelona high pressing line leaves significant transition space for rapid counter-attacks. Poisson projection suggests 2.1 expected goals for Madrid vs 1.2 for Barca.',
      isPinned: true,
      status: 'upcoming',
      authorId: adminUser.id,
      authorName: adminUser.displayName,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      tags: ['La Liga', 'El Clasico', 'Safe Pick', 'Double Chance'],
    },
    {
      id: 'pred_003',
      title: 'Bayern Munich vs Borussia Dortmund - Der Klassiker',
      league: 'German Bundesliga',
      homeTeam: 'Bayern Munich',
      awayTeam: 'Borussia Dortmund',
      kickoffTime: new Date(Date.now() + 86400000 * 4).toISOString(),
      predictionTip: 'Over 3.5 Total Match Goals',
      marketType: 'Over/Under',
      odds: 1.95,
      confidenceScore: 79,
      analysis: 'Der Klassiker has produced 4+ goals in 7 of the previous 8 encounters. Both squads rank in the top 3% across European leagues for expected shots per 90 minutes. Backing offensive potency over defensive containment.',
      isPinned: false,
      status: 'upcoming',
      authorId: adminUser.id,
      authorName: adminUser.displayName,
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      tags: ['Bundesliga', 'High Value', 'Goals Galore'],
    },
    {
      id: 'pred_004',
      title: 'Inter Milan vs Juventus - Derby d Italia',
      league: 'Italian Serie A',
      homeTeam: 'Inter Milan',
      awayTeam: 'Juventus',
      kickoffTime: new Date(Date.now() + 86400000 * 5).toISOString(),
      predictionTip: 'Under 2.5 Total Match Goals',
      marketType: 'Over/Under',
      odds: 1.76,
      confidenceScore: 82,
      analysis: 'Classical tactical standoff with both sides prioritizing solid low blocks. Inter allow only 0.72 xGA per home match; Juventus maintain the stingiest defensive structure in Serie A away games.',
      isPinned: false,
      status: 'upcoming',
      authorId: adminUser.id,
      authorName: adminUser.displayName,
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      tags: ['Serie A', 'Tactical Pick', 'Under Goals'],
    },
  ];

  const initialBookingCodes: BookingCode[] = [
    {
      id: 'code_01',
      platform: 'Bet9ja',
      code: 'B9-772491',
      title: 'Weekend European Top Leagues Combo (5-Fold)',
      odds: 5.64,
      matchCount: 5,
      stakeTip: 'Medium stake (2-3 units). Safe Cut-1 protection enabled.',
      authorId: adminUser.id,
      authorName: 'Chief Analyst John',
      isVerified: true,
      copyCount: 142,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'code_02',
      platform: 'SportyBet',
      code: 'SB-883190',
      title: 'Over 2.5 Goals Premier League & Bundesliga Banker',
      odds: 3.42,
      matchCount: 3,
      stakeTip: 'High confidence. Great for accumulator boosters.',
      authorId: adminUser.id,
      authorName: 'Chief Analyst John',
      isVerified: true,
      copyCount: 289,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'code_03',
      platform: 'MSport',
      code: 'MS-510928',
      title: 'Super Odds Boost: Real Madrid & Bayern Munich Wins',
      odds: 2.85,
      matchCount: 2,
      stakeTip: 'Utilize MSport zero-margin market enhancement.',
      authorId: adminUser.id,
      authorName: 'Chief Analyst John',
      isVerified: true,
      copyCount: 96,
      createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    },
    {
      id: 'code_04',
      platform: 'Football.com',
      code: 'FC-409121',
      title: 'Champions League Midweek Double Chance Acca',
      odds: 4.12,
      matchCount: 4,
      stakeTip: 'Ideal with fast payout guarantee.',
      authorId: adminUser.id,
      authorName: 'Chief Analyst John',
      isVerified: true,
      copyCount: 81,
      createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    },
  ];

  const initialMarketplace: MarketplaceItem[] = [
    {
      id: 'item_01',
      title: 'Authentic 2024/25 Arsenal Home Jersey (Size M)',
      category: 'Jersey & Apparel',
      price: 65,
      currency: 'USD',
      condition: 'Brand New',
      description: 'Brand new with original tags. Official club merchandise with Premier League badge.',
      location: 'London, UK / Worldwide Shipping',
      sellerId: adminUser.id,
      sellerName: 'Chief Analyst John',
      sellerEmail: 'johnlsacc23332@gmail.com',
      isApproved: true,
      createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
    {
      id: 'item_02',
      title: 'Nike Mercurial Superfly 9 FG Cleats (US 10 / EU 44)',
      category: 'Footwear & Boots',
      price: 110,
      currency: 'USD',
      condition: 'Like New',
      description: 'Worn twice on natural grass. Superb grip, clean studs, includes carry bag.',
      location: 'Manchester, UK',
      sellerId: adminUser.id,
      sellerName: 'Chief Analyst John',
      sellerEmail: 'johnlsacc23332@gmail.com',
      isApproved: true,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'item_03',
      title: 'Signed Memorabilia: Kevin De Bruyne Certified Card',
      category: 'Memorabilia',
      price: 180,
      currency: 'USD',
      condition: 'Brand New',
      description: 'Certified authentic signed collector card with hologram and certificate of authenticity.',
      location: 'Birmingham, UK',
      sellerId: adminUser.id,
      sellerName: 'Chief Analyst John',
      sellerEmail: 'johnlsacc23332@gmail.com',
      isApproved: true,
      createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    },
    {
      id: 'item_04',
      title: 'Tactical Analysis & Expected Goals (xG) Master Manual',
      category: 'Guides & Strategy',
      price: 25,
      currency: 'USD',
      condition: 'Brand New',
      description: 'Printed 140-page guide on football probability modeling, Poisson distributions, and value odds calculation.',
      location: 'Digital / Physical Shipment',
      sellerId: adminUser.id,
      sellerName: 'Chief Analyst John',
      sellerEmail: 'johnlsacc23332@gmail.com',
      isApproved: true,
      createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    },
  ];

  const initialMessages: ChatMessage[] = [
    {
      id: 'msg_001',
      userId: adminUser.id,
      username: adminUser.username,
      displayName: adminUser.displayName,
      userRole: 'admin',
      avatarColor: adminUser.avatarColor,
      content: 'Welcome to SAFE PICKS ARENA! 🏆 Real-time sports analytics, community chat, and match probabilities. All free forever. Keep discussions respectful and sports-focused!',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      reactions: { '⚽': [adminUser.id], '🔥': [adminUser.id] },
    },
  ];

  return {
    users: [adminUser],
    sessions: [],
    predictions: initialPredictions,
    messages: initialMessages,
    directMessages: [],
    friendRequests: [],
    bookingCodes: initialBookingCodes,
    marketplace: initialMarketplace,
    reports: [],
    blocks: [],
  };
}

class Database {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    if (!fs.existsSync(DB_FILE)) {
      const initial = initialSeed();
      this.saveFileSync(initial);
      return initial;
    }

    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      // Ensure all arrays exist
      return {
        users: parsed.users || [],
        sessions: parsed.sessions || [],
        predictions: parsed.predictions || [],
        messages: parsed.messages || [],
        directMessages: parsed.directMessages || [],
        friendRequests: parsed.friendRequests || [],
        bookingCodes: parsed.bookingCodes || [],
        marketplace: parsed.marketplace || [],
        reports: parsed.reports || [],
        blocks: parsed.blocks || [],
      };
    } catch (err) {
      console.error('Failed to parse database file, re-initializing seed:', err);
      const initial = initialSeed();
      this.saveFileSync(initial);
      return initial;
    }
  }

  private saveFileSync(data: DatabaseSchema) {
    const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  }

  public save() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      try {
        this.saveFileSync(this.data);
      } catch (err) {
        console.error('Error persisting database:', err);
      }
    }, 100);
  }

  public saveImmediate() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.saveFileSync(this.data);
  }

  // Users
  public getUsers(): User[] {
    return this.data.users;
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserByUsername(username: string): User | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public addUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.findUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  // Sessions
  public addSession(session: Session) {
    // Purge expired sessions
    const now = new Date().toISOString();
    this.data.sessions = this.data.sessions.filter(s => s.expiresAt > now);
    this.data.sessions.push(session);
    this.save();
  }

  public findSession(token: string): Session | undefined {
    const now = new Date().toISOString();
    return this.data.sessions.find(s => s.token === token && s.expiresAt > now);
  }

  public deleteSession(token: string) {
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    this.save();
  }

  public deleteUserSessions(userId: string) {
    this.data.sessions = this.data.sessions.filter(s => s.userId !== userId);
    this.save();
  }

  // Predictions
  public getPredictions(): PredictionPost[] {
    return [...this.data.predictions].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  public findPredictionById(id: string): PredictionPost | undefined {
    return this.data.predictions.find(p => p.id === id);
  }

  public addPrediction(pred: PredictionPost): PredictionPost {
    this.data.predictions.unshift(pred);
    this.save();
    return pred;
  }

  public updatePrediction(id: string, updates: Partial<PredictionPost>): PredictionPost | undefined {
    const pred = this.findPredictionById(id);
    if (!pred) return undefined;
    Object.assign(pred, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return pred;
  }

  public deletePrediction(id: string): boolean {
    const idx = this.data.predictions.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.predictions.splice(idx, 1);
    this.save();
    return true;
  }

  // Chat Messages
  public getMessages(limit = 100): ChatMessage[] {
    return this.data.messages.slice(-limit);
  }

  public addMessage(msg: ChatMessage): ChatMessage {
    this.data.messages.push(msg);
    // Keep max 2,000 messages in history for optimal performance
    if (this.data.messages.length > 2000) {
      this.data.messages = this.data.messages.slice(-1500);
    }
    this.save();
    return msg;
  }

  public updateMessage(id: string, updates: Partial<ChatMessage>): ChatMessage | undefined {
    const msg = this.data.messages.find(m => m.id === id);
    if (!msg) return undefined;
    Object.assign(msg, updates);
    this.save();
    return msg;
  }

  public findMessageById(id: string): ChatMessage | undefined {
    return this.data.messages.find(m => m.id === id);
  }

  public deleteMessage(id: string): boolean {
    const idx = this.data.messages.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.data.messages.splice(idx, 1);
    this.save();
    return true;
  }

  // Direct Messages
  public getDirectMessages(user1: string, user2: string, limit = 50): ChatMessage[] {
    return this.data.directMessages
      .filter(
        m =>
          (m.userId === user1 && m.recipientId === user2) ||
          (m.userId === user2 && m.recipientId === user1)
      )
      .slice(-limit);
  }

  public addDirectMessage(msg: ChatMessage): ChatMessage {
    this.data.directMessages.push(msg);
    if (this.data.directMessages.length > 3000) {
      this.data.directMessages = this.data.directMessages.slice(-2000);
    }
    this.save();
    return msg;
  }

  // Friend Requests
  public getFriendRequests(userId: string): FriendRequest[] {
    return this.data.friendRequests.filter(
      r => (r.fromUserId === userId || r.toUserId === userId) && r.status === 'pending'
    );
  }

  public getFriends(userId: string): string[] {
    const friends = new Set<string>();
    for (const r of this.data.friendRequests) {
      if (r.status === 'accepted') {
        if (r.fromUserId === userId) friends.add(r.toUserId);
        if (r.toUserId === userId) friends.add(r.fromUserId);
      }
    }
    return Array.from(friends);
  }

  public addFriendRequest(fromUserId: string, toUserId: string): FriendRequest {
    const existing = this.data.friendRequests.find(
      r =>
        ((r.fromUserId === fromUserId && r.toUserId === toUserId) ||
          (r.fromUserId === toUserId && r.toUserId === fromUserId)) &&
        r.status !== 'declined'
    );
    if (existing) return existing;

    const req: FriendRequest = {
      id: `freq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.data.friendRequests.push(req);
    this.save();
    return req;
  }

  public respondFriendRequest(id: string, status: 'accepted' | 'declined'): FriendRequest | undefined {
    const req = this.data.friendRequests.find(r => r.id === id);
    if (!req) return undefined;
    req.status = status;
    this.save();
    return req;
  }

  public removeFriend(userId: string, targetUserId: string): boolean {
    let removed = false;
    this.data.friendRequests = this.data.friendRequests.filter(r => {
      const isMatch =
        (r.fromUserId === userId && r.toUserId === targetUserId) ||
        (r.fromUserId === targetUserId && r.toUserId === userId);
      if (isMatch) removed = true;
      return !isMatch;
    });
    if (removed) this.save();
    return removed;
  }

  // Blocks
  public blockUser(userId: string, blockedUserId: string) {
    if (!this.data.blocks.some(b => b.userId === userId && b.blockedUserId === blockedUserId)) {
      this.data.blocks.push({
        userId,
        blockedUserId,
        createdAt: new Date().toISOString(),
      });
      this.save();
    }
  }

  public unblockUser(userId: string, blockedUserId: string) {
    this.data.blocks = this.data.blocks.filter(
      b => !(b.userId === userId && b.blockedUserId === blockedUserId)
    );
    this.save();
  }

  public getBlockedUserIds(userId: string): string[] {
    return this.data.blocks.filter(b => b.userId === userId).map(b => b.blockedUserId);
  }

  // Reports
  public addReport(report: ChatReport): ChatReport {
    this.data.reports.push(report);
    this.save();
    return report;
  }

  public getReports(): ChatReport[] {
    return this.data.reports;
  }

  public updateReport(id: string, status: 'reviewed' | 'dismissed'): ChatReport | undefined {
    const r = this.data.reports.find(item => item.id === id);
    if (!r) return undefined;
    r.status = status;
    this.save();
    return r;
  }

  // Booking Codes
  public getBookingCodes(platform?: string): BookingCode[] {
    let list = this.data.bookingCodes;
    if (platform) {
      list = list.filter(c => c.platform.toLowerCase() === platform.toLowerCase());
    }
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public addBookingCode(code: BookingCode): BookingCode {
    this.data.bookingCodes.unshift(code);
    this.save();
    return code;
  }

  public incrementCodeCopy(id: string): number {
    const code = this.data.bookingCodes.find(c => c.id === id);
    if (!code) return 0;
    code.copyCount = (code.copyCount || 0) + 1;
    this.save();
    return code.copyCount;
  }

  // Marketplace
  public getMarketplace(category?: string, search?: string): MarketplaceItem[] {
    let items = this.data.marketplace.filter(m => m.isApproved);
    if (category && category !== 'All') {
      items = items.filter(m => m.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        m =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.location.toLowerCase().includes(q)
      );
    }
    return [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public addMarketplaceItem(item: MarketplaceItem): MarketplaceItem {
    this.data.marketplace.unshift(item);
    this.save();
    return item;
  }

  public deleteMarketplaceItem(id: string): boolean {
    const idx = this.data.marketplace.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.data.marketplace.splice(idx, 1);
    this.save();
    return true;
  }

  public getStats() {
    const now = Date.now();
    const activeUsersCount = this.data.users.filter(
      u => now - new Date(u.lastActiveAt).getTime() < 5 * 60 * 1000
    ).length;

    return {
      totalUsers: this.data.users.length,
      activeUsers: activeUsersCount,
      totalPredictions: this.data.predictions.length,
      totalMessages: this.data.messages.length,
      totalBookingCodes: this.data.bookingCodes.length,
      totalMarketplaceItems: this.data.marketplace.length,
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}

export const db = new Database();
export { hashPassword };
