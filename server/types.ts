export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  role: 'admin' | 'user';
  isEmailVerified: boolean;
  verificationCode?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
  avatarColor: string;
  bio?: string;
  favoriteTeam?: string;
  isBanned?: boolean;
  createdAt: string;
  lastActiveAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface PredictionPost {
  id: string;
  title: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  kickoffTime: string;
  predictionTip: string;
  marketType: '1X2' | 'Over/Under' | 'BTTS' | 'Double Chance' | 'Handicap';
  odds: number;
  confidenceScore: number; // 1-100%
  analysis: string;
  isPinned: boolean;
  status: 'upcoming' | 'in_play' | 'won' | 'lost' | 'void';
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  userRole: 'admin' | 'user';
  avatarColor: string;
  content: string;
  createdAt: string;
  reactions: Record<string, string[]>; // emoji -> array of userIds
  isDirect?: boolean;
  recipientId?: string;
  isReported?: boolean;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface BookingCode {
  id: string;
  platform: 'Bet9ja' | 'SportyBet' | 'MSport' | 'Football.com';
  code: string;
  title: string;
  odds: number;
  matchCount: number;
  stakeTip?: string;
  authorId: string;
  authorName: string;
  isVerified: boolean;
  copyCount: number;
  createdAt: string;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  category: 'Jersey & Apparel' | 'Match Tickets' | 'Memorabilia' | 'Footwear & Boots' | 'Guides & Strategy';
  price: number;
  currency: 'USD' | 'NGN' | 'EUR' | 'GBP';
  condition: 'Brand New' | 'Like New' | 'Good Condition';
  description: string;
  imageUrl?: string;
  location: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  isApproved: boolean;
  createdAt: string;
}

export interface ChatReport {
  id: string;
  messageId: string;
  messageContent: string;
  reportedUserId: string;
  reportedUsername: string;
  reporterUserId: string;
  reason: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'dismissed';
}
