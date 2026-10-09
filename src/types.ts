export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: 'admin' | 'user';
  isEmailVerified: boolean;
  avatarColor: string;
  bio?: string;
  favoriteTeam?: string;
  createdAt: string;
  lastActiveAt: string;
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
  confidenceScore: number;
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
  reactions: Record<string, string[]>;
  isDirect?: boolean;
  recipientId?: string;
  isReported?: boolean;
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

export interface SportsMatch {
  id: string;
  leagueId: string;
  leagueName: string;
  homeTeam: string;
  awayTeam: string;
  homeBadge?: string;
  awayBadge?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  kickoffTime: string;
  status: 'SCHEDULED' | 'TIMED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED';
  round?: string;
  venue?: string;
  lastUpdated: string;
}

export interface LeagueStanding {
  position: number;
  team: string;
  badge?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: string;
}

export interface MatchAnalysis {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoffTime: string;
  modelName: string;
  homeExpectedGoals: number;
  awayExpectedGoals: number;
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  fairOdds: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  mostLikelyScoreline: {
    score: string;
    probability: number;
  };
  recentForm: {
    home: string;
    away: string;
  };
  performanceStats: {
    homeAverageScored: number;
    homeAverageConceded: number;
    awayAverageScored: number;
    awayAverageConceded: number;
    headToHeadMeetings: number;
    headToHeadHomeWins: number;
    headToHeadDraws: number;
    headToHeadAwayWins: number;
  };
  influencingFactors: {
    factor: string;
    impact: 'positive' | 'neutral' | 'negative';
    description: string;
  }[];
  disclaimer: string;
  dataSource: string;
  calculatedAt: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}
