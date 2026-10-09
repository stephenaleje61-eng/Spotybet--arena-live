import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { BookingCode } from '../types';
import {
  Layers,
  Copy,
  Check,
  PlusCircle,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  X,
  Send,
} from 'lucide-react';

export const SpacesHub: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const [activePlatform, setActivePlatform] = useState<'Bet9ja' | 'SportyBet' | 'MSport' | 'Football.com'>('Bet9ja');
  const [codes, setCodes] = useState<BookingCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Code Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [codeValue, setCodeValue] = useState('');
  const [title, setTitle] = useState('');
  const [odds, setOdds] = useState('4.50');
  const [matchCount, setMatchCount] = useState('4');
  const [stakeTip, setStakeTip] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await api.getBookingCodes(activePlatform);
      setCodes(res.codes);
    } catch (err) {
      console.error('Error fetching codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, [activePlatform]);

  const handleCopy = async (code: BookingCode) => {
    try {
      await navigator.clipboard.writeText(code.code);
      setCopiedId(code.id);
      await api.copyBookingCode(code.id);
      setTimeout(() => setCopiedId(null), 2000);
      setCodes(prev =>
        prev.map(c => (c.id === code.id ? { ...c, copyCount: (c.copyCount || 0) + 1 } : c))
      );
    } catch {
      alert(`Code: ${code.code}`);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    setSubmitting(true);
    try {
      await api.createBookingCode(activePlatform, {
        code: codeValue,
        title,
        odds: Number(odds) || 2.0,
        matchCount: Number(matchCount) || 1,
        stakeTip,
      });

      setModalOpen(false);
      setCodeValue('');
      setTitle('');
      setStakeTip('');
      fetchCodes();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error sharing code');
    } finally {
      setSubmitting(false);
    }
  };

  const platformInfo = {
    Bet9ja: {
      color: '#10B981',
      bgLight: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      badge: 'Cut-1 Protection Space',
      officialUrl: 'https://sports.bet9ja.com',
      description:
        'Bet9ja is renowned for its multiple accumulator boosts and Cut-1 insurance feature. Share and browse high-conviction Bet9ja booking codes with mathematical odds verification.',
      features: ['Cut-1 feature insurance', 'Up to 170% Multiple Boost', 'Live In-Play Markets', 'Direct Booking Codes'],
    },
    SportyBet: {
      color: '#EF4444',
      bgLight: 'bg-red-500/10 border-red-500/30 text-red-400',
      badge: 'Live Odds Surge Space',
      officialUrl: 'https://www.sportybet.com',
      description:
        'SportyBet offers dynamic real-time odds, high-speed cashouts, and accumulator boosters. Discover booking codes calculated against European leagues.',
      features: ['Super-Fast Cashout Engine', 'Accumulator Win Boosters', 'Instant Live Streaming', 'Re-Bet & Share Codes'],
    },
    MSport: {
      color: '#3B82F6',
      bgLight: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      badge: 'Super Odds Margin Space',
      officialUrl: 'https://www.msport.com',
      description:
        'MSport provides zero-margin super odds and extensive football handicap lines. Compare code combinations crafted by Safe Picks Arena members.',
      features: ['Zero-Margin Super Odds', 'Weekly Millions Jackpot', 'Enhanced Over/Under Lines', 'Instant Payout Rails'],
    },
    'Football.com': {
      color: '#60A5FA',
      bgLight: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      badge: 'Fast Payout Space',
      officialUrl: 'https://www.football.com',
      description:
        'Football.com delivers a direct football-first experience with competitive odds across 80+ domestic leagues and UEFA club tournaments.',
      features: ['Football-Dedicated Interface', 'Competitive Asian Lines', 'Real-time Match Matchups', 'Rapid Ticket Settlement'],
    },
  };

  const currentMeta = platformInfo[activePlatform];

  return (
    <div className="space-y-6">
      {/* Official Disclaimer Banner */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-neutral-300">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-blue-400 uppercase tracking-wider">Independent Sports Arena Disclaimer: </span>
            Safe Picks Arena is an independent statistical analysis and prediction community. We are NOT officially affiliated with, endorsed by, or sponsored by Bet9ja, SportyBet, MSport, or Football.com. All trademarks, names, and logos belong exclusively to their respective corporate owners. Content is intended solely for data modeling and entertainment.
          </div>
        </div>
      </div>

      {/* Main Spaces Navigation Header */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>SPORTS PLATFORM SPACES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">BOOKMAKER SPACES & CODES</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Dedicated analytical spaces, verified booking codes, and tactical market insights for top betting platforms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!user) openAuthModal('login');
                else setModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Share Booking Code</span>
            </button>

            <a
              href={currentMeta.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-xs font-bold text-neutral-300 hover:text-white hover:border-neutral-600 transition-all"
            >
              <span>Official {activePlatform} Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Platform Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['Bet9ja', 'SportyBet', 'MSport', 'Football.com'] as const).map(platform => {
            const isSelected = activePlatform === platform;
            return (
              <button
                key={platform}
                onClick={() => setActivePlatform(platform)}
                className={`flex flex-col items-center justify-center rounded-2xl p-3 border transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-600 text-white shadow-lg font-black'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700 hover:text-white font-bold'
                }`}
              >
                <span className="text-sm">{platform} Space</span>
                <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-neutral-500'}`}>
                  {platformInfo[platform].badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Platform Description & Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${currentMeta.bgLight}`}>
              {activePlatform} Hub
            </span>
            <span className="text-xs text-neutral-400 font-semibold">Analytical Space</span>
          </div>
          <h3 className="text-xl font-black text-white mb-2">About {activePlatform} Tactical Space</h3>
          <p className="text-xs text-neutral-300 leading-relaxed mb-4">{currentMeta.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-800">
            {currentMeta.features.map((feat, i) => (
              <div key={i} className="rounded-xl bg-neutral-950 p-2.5 border border-neutral-800/80 text-center">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-neutral-200">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-blue-400 mb-2">
              Arena Best Practices
            </h3>
            <ul className="space-y-2 text-xs text-neutral-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span>Verify match kickoff times prior to loading booking tickets into platform slip.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span>Use Cut-1 or Double Chance markets to minimize accumulator volatility.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span>Never stake more than allocated units; statistical models represent estimates only.</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-neutral-800 mt-4">
            <div className="text-[11px] text-neutral-500">
              Active Community Booking Codes: <span className="font-bold text-white">{codes.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Community Booking Codes List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <TrendingUp className="h-4 w-4" />
            <span>VERIFIED {activePlatform.toUpperCase()} BOOKING CODES</span>
          </div>
          <span className="text-xs text-neutral-500">Click copy to load into your bookmaker slip</span>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : codes.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">
            <p>No booking codes shared for {activePlatform} yet.</p>
            <button
              onClick={() => {
                if (!user) openAuthModal('login');
                else setModalOpen(true);
              }}
              className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white"
            >
              Share First Code
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {codes.map(c => {
              const isCopied = copiedId === c.id;
              return (
                <div
                  key={c.id}
                  className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-5 hover:border-blue-400/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded-lg bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
                      {c.matchCount} Matches
                    </span>
                    {c.isVerified && (
                      <span className="rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 text-[10px] font-bold">
                        Analyst Verified
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-black text-white group-hover:text-blue-400 transition-colors">
                    {c.title}
                  </h4>

                  {c.stakeTip && (
                    <p className="text-xs text-neutral-400 mt-1 italic">
                      Tip: {c.stakeTip}
                    </p>
                  )}

                  {/* Booking Code Banner */}
                  <div className="my-4 flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-950 p-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-neutral-500">Booking Code</div>
                      <div className="font-mono text-lg font-black tracking-widest text-blue-400">
                        {c.code}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold">Total Odds</div>
                        <div className="font-mono text-sm font-black text-white">@{c.odds.toFixed(2)}</div>
                      </div>

                      <button
                        onClick={() => handleCopy(c)}
                        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                          isCopied
                            ? 'bg-emerald-500 text-black'
                            : 'bg-blue-600 text-white hover:bg-blue-500'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-800/80">
                    <span>By: {c.authorName}</span>
                    <span>Copied {c.copyCount || 0} times</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Share Booking Code Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-blue-500/30 bg-neutral-900 p-6 text-white shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-1">
              Share {activePlatform} Booking Code
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Submit your verified accumulator or combo code for community analysis.
            </p>

            <form onSubmit={handleShareSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Booking Code *
                </label>
                <input
                  type="text"
                  required
                  value={codeValue}
                  onChange={e => setCodeValue(e.target.value.toUpperCase())}
                  placeholder="e.g. B9-772491"
                  className="w-full font-mono text-base tracking-wider rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-blue-400 placeholder-neutral-600 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Ticket Title / Description *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Weekend Premier League Goals Banker"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    Combined Odds *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.01"
                    required
                    value={odds}
                    onChange={e => setOdds(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    Matches Count *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={matchCount}
                    onChange={e => setMatchCount(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Staking Advice / Strategy Tip
                </label>
                <input
                  type="text"
                  value={stakeTip}
                  onChange={e => setStakeTip(e.target.value)}
                  placeholder="e.g. Medium 2-unit stake with Cut-1 active"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-black text-white hover:bg-blue-500 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Sharing...' : 'Publish Booking Code'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
