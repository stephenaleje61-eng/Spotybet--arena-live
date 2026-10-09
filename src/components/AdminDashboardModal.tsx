import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  X,
  LayoutDashboard,
  PlusCircle,
  Flag,
  Users,
  CheckCircle2,
  AlertCircle,
  Pin,
  Trash2,
  Activity,
  Send,
} from 'lucide-react';
import type { PredictionPost, User } from '../types';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPredictionCreated?: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  onPredictionCreated,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'publish' | 'manage' | 'reports' | 'users'>('publish');

  // Form states for publishing
  const [title, setTitle] = useState('');
  const [league, setLeague] = useState('English Premier League');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [kickoffTime, setKickoffTime] = useState('');
  const [predictionTip, setPredictionTip] = useState('');
  const [marketType, setMarketType] = useState<'1X2' | 'Over/Under' | 'BTTS' | 'Double Chance' | 'Handicap'>('1X2');
  const [odds, setOdds] = useState('1.85');
  const [confidenceScore, setConfidenceScore] = useState('85');
  const [analysis, setAnalysis] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [tagsInput, setTagsInput] = useState('Banker Pick, xG Advantage');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Manage predictions list
  const [predictions, setPredictions] = useState<PredictionPost[]>([]);
  // Reports list
  const [reports, setReports] = useState<any[]>([]);
  // Users list
  const [usersList, setUsersList] = useState<User[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'manage') {
        const res = await api.getPredictions();
        setPredictions(res.predictions);
      } else if (activeTab === 'reports') {
        const res = await api.getAdminReports();
        setReports(res.reports);
      } else if (activeTab === 'users') {
        const res = await api.getAdminUsers();
        setUsersList(res.users);
      }
    } catch (err: unknown) {
      console.error('Admin load error:', err);
    }
  };

  if (!isOpen) return null;

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await api.createPrediction({
        title: title || `${homeTeam} vs ${awayTeam} Analysis`,
        league,
        homeTeam,
        awayTeam,
        kickoffTime: kickoffTime ? new Date(kickoffTime).toISOString() : new Date(Date.now() + 86400000).toISOString(),
        predictionTip,
        marketType,
        odds: Number(odds) || 1.85,
        confidenceScore: Number(confidenceScore) || 80,
        analysis,
        isPinned,
        tags,
      });

      setSuccess('Prediction post published successfully! Visible immediately to all users.');
      // Reset form
      setTitle('');
      setHomeTeam('');
      setAwayTeam('');
      setPredictionTip('');
      setAnalysis('');
      setIsPinned(false);

      if (onPredictionCreated) onPredictionCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to publish prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await api.togglePinPrediction(id);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error toggling pin');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prediction?')) return;
    try {
      await api.deletePrediction(id);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting prediction');
    }
  };

  const handleResolveReport = async (reportId: string, status: 'reviewed' | 'dismissed') => {
    try {
      await api.resolveAdminReport(reportId, status);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error resolving report');
    }
  };

  const handleToggleBan = async (u: User) => {
    const isBanned = (u as any).isBanned;
    try {
      await api.updateAdminUser(u.id, { isBanned: !isBanned });
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-blue-500/40 bg-neutral-900 p-6 text-white shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-black shadow-lg shadow-blue-500/25">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white">ADMIN COMMAND CENTER</h2>
              <span className="rounded-full bg-blue-500/20 border border-blue-500/40 px-2.5 py-0.5 text-[10px] font-black text-blue-300 uppercase">
                Restricted Access
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Publish featured predictions, pin top matches, manage community reports, and enforce platform safety.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-neutral-800 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('publish')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'publish'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publish Prediction</span>
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'manage'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Manage Existing Posts</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Chat Moderation ({reports.filter(r => r.status === 'pending').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Accounts</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/30 p-3 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-sm text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* TAB 1: PUBLISH PREDICTION */}
        {activeTab === 'publish' && (
          <form onSubmit={handlePublishSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Home Team *
                </label>
                <input
                  type="text"
                  required
                  value={homeTeam}
                  onChange={e => setHomeTeam(e.target.value)}
                  placeholder="e.g. Arsenal"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Away Team *
                </label>
                <input
                  type="text"
                  required
                  value={awayTeam}
                  onChange={e => setAwayTeam(e.target.value)}
                  placeholder="e.g. Manchester City"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  League / Competition *
                </label>
                <select
                  value={league}
                  onChange={e => setLeague(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-400 focus:outline-none"
                >
                  <option value="English Premier League">English Premier League</option>
                  <option value="Spanish La Liga">Spanish La Liga</option>
                  <option value="UEFA Champions League">UEFA Champions League</option>
                  <option value="Italian Serie A">Italian Serie A</option>
                  <option value="German Bundesliga">German Bundesliga</option>
                  <option value="French Ligue 1">French Ligue 1</option>
                  <option value="International Fixture">International Fixture</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Kickoff Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={kickoffTime}
                  onChange={e => setKickoffTime(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Prediction Tip *
                </label>
                <input
                  type="text"
                  required
                  value={predictionTip}
                  onChange={e => setPredictionTip(e.target.value)}
                  placeholder="e.g. BTTS & Over 2.5 Goals"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Decimal Odds *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  required
                  value={odds}
                  onChange={e => setOdds(e.target.value)}
                  placeholder="1.85"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Confidence Score (1-100)%
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={confidenceScore}
                  onChange={e => setConfidenceScore(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                Tactical Analysis & Mathematical Rationale
              </label>
              <textarea
                rows={3}
                required
                value={analysis}
                onChange={e => setAnalysis(e.target.value)}
                placeholder="Explain the Poisson distribution, xG performance, recent home/away form, and tactical matchup..."
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-300">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={e => setIsPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-950 text-blue-500 focus:ring-blue-400"
                />
                <span className="font-bold flex items-center gap-1">
                  <Pin className="h-3.5 w-3.5 text-blue-400" />
                  Pin to Top of Homepage (Hero Banker Pick)
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-black text-white hover:bg-blue-500 transition-all disabled:opacity-50 shadow-md shadow-blue-500/25"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Publishing...' : 'Publish to Arena Now'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: MANAGE EXISTING POSTS */}
        {activeTab === 'manage' && (
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
            {predictions.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-8">No predictions found.</p>
            ) : (
              predictions.map(pred => (
                <div
                  key={pred.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-400">{pred.league}</span>
                      {pred.isPinned && (
                        <span className="rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold px-1.5 py-0.5">
                          PINNED
                        </span>
                      )}
                    </div>
                    <div className="text-base font-black text-white mt-0.5">
                      {pred.homeTeam} vs {pred.awayTeam}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">
                      Tip: <span className="font-bold text-white">{pred.predictionTip}</span> (@{pred.odds.toFixed(2)}) • Confidence: {pred.confidenceScore}%
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTogglePin(pred.id)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                        pred.isPinned
                          ? 'bg-blue-600 text-white'
                          : 'border border-neutral-700 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {pred.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      onClick={() => handleDelete(pred.id)}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: CHAT MODERATION */}
        {activeTab === 'reports' && (
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
            {reports.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-8">
                No reported messages! Community chat is running clean.
              </p>
            ) : (
              reports.map(rep => (
                <div
                  key={rep.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <span>Reported User:</span>
                      <span className="font-bold text-white">@{rep.reportedUsername}</span>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 font-bold text-[10px] uppercase ${
                        rep.status === 'pending' ? 'bg-blue-500/20 text-blue-400' : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>

                  <div className="rounded-xl bg-neutral-900 p-3 text-xs text-neutral-200 border border-neutral-800 italic">
                    "{rep.messageContent}"
                  </div>

                  <div className="text-xs text-neutral-400">
                    Reason: <span className="text-neutral-300">{rep.reason}</span>
                  </div>

                  {rep.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleResolveReport(rep.id, 'reviewed')}
                        className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
                      >
                        Acknowledge & Resolve
                      </button>
                      <button
                        onClick={() => handleResolveReport(rep.id, 'dismissed')}
                        className="rounded-xl border border-neutral-700 px-3 py-1.5 text-xs font-bold text-neutral-400 hover:text-white"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: USER ACCOUNTS */}
        {activeTab === 'users' && (
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
            {usersList.map(u => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{u.displayName}</span>
                    <span className="text-xs text-neutral-400">(@{u.username})</span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                        u.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {u.email} • Club: {u.favoriteTeam || 'N/A'} • Joined: {new Date(u.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {u.id !== user?.id && (
                    <button
                      onClick={() => handleToggleBan(u)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                        (u as any).isBanned
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                      }`}
                    >
                      {(u as any).isBanned ? 'Unban User' : 'Ban User'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
