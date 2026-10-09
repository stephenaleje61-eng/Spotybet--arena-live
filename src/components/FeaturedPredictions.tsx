import React, { useState, useEffect } from 'react';
import type { PredictionPost } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Flame,
  Pin,
  Clock,
  TrendingUp,
  Percent,
  CheckCircle2,
  Trash2,
  PlusCircle,
  ShieldAlert,
  ChevronRight,
  Send,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface FeaturedPredictionsProps {
  openAdminModal: () => void;
  onSelectMatchAnalysis?: (home: string, away: string) => void;
}

export const FeaturedPredictions: React.FC<FeaturedPredictionsProps> = ({
  openAdminModal,
  onSelectMatchAnalysis,
}) => {
  const { user, isAdmin } = useAuth();
  const [predictions, setPredictions] = useState<PredictionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick In-Page Post Game Form for Admin (Requirement: "add where admin can post game, everyone can see it")
  const [showQuickPost, setShowQuickPost] = useState(false);
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [league, setLeague] = useState('English Premier League');
  const [kickoffTime, setKickoffTime] = useState('');
  const [predictionTip, setPredictionTip] = useState('');
  const [odds, setOdds] = useState('1.90');
  const [confidenceScore, setConfidenceScore] = useState('85');
  const [analysis, setAnalysis] = useState('');
  const [isPinned, setIsPinned] = useState(true);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const res = await api.getPredictions();
      setPredictions(res.predictions);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();

    // Listen to real-time events via SSE so EVERYONE sees newly posted games instantly!
    const es = new EventSource('/api/chat/stream');
    es.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_prediction') {
          setPredictions(prev => [data.payload, ...prev.filter(p => p.id !== data.payload.id)]);
        } else if (data.type === 'update_prediction') {
          setPredictions(prev => prev.map(p => (p.id === data.payload.id ? data.payload : p)));
        } else if (data.type === 'delete_prediction') {
          setPredictions(prev => prev.filter(p => p.id !== data.payload.id));
        }
      } catch {
        // silent
      }
    };

    return () => {
      es.close();
    };
  }, []);

  const handleQuickPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setSubmittingPost(true);
    setPostSuccess(null);
    try {
      const newPost = await api.createPrediction({
        title: `${homeTeam} vs ${awayTeam} Match Analysis`,
        league,
        homeTeam,
        awayTeam,
        kickoffTime: kickoffTime ? new Date(kickoffTime).toISOString() : new Date(Date.now() + 86400000).toISOString(),
        predictionTip,
        odds: Number(odds) || 1.85,
        confidenceScore: Number(confidenceScore) || 85,
        analysis: analysis || 'Form-weighted Poisson statistical analysis indicates strong expectancy differential.',
        isPinned,
        marketType: '1X2',
        tags: ['Admin Top Pick', 'Verified Safe Pick'],
      });

      setPostSuccess(`Match post "${homeTeam} vs ${awayTeam}" published! Now visible to all users worldwide.`);
      // Reset form fields
      setHomeTeam('');
      setAwayTeam('');
      setPredictionTip('');
      setAnalysis('');
      setShowQuickPost(false);
      fetchPredictions();

      setTimeout(() => setPostSuccess(null), 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to publish game');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await api.togglePinPrediction(id);
      fetchPredictions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error toggling pin');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this game prediction?')) return;
    try {
      await api.deletePrediction(id);
      setPredictions(prev => prev.filter(p => p.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting prediction');
    }
  };

  const pinnedPredictions = predictions.filter(p => p.isPinned);
  const regularPredictions = predictions.filter(p => !p.isPinned);

  return (
    <section className="w-full space-y-6">
      {/* Top Hero Header with Blue Accents */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-r from-neutral-950 via-neutral-900 to-black p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-400">
              <Flame className="h-4 w-4 fill-blue-400" />
              <span>FEATURED GAMES & MATHEMATICAL PREDICTIONS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              SAFE PICKS <span className="text-blue-400">ARENA</span>
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-neutral-300">
              High-confidence mathematical match forecasts powered by calibrated Poisson xG algorithms,
              tactical team news, and head-to-head records. Always 100% free with zero paywalls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin ? (
              <button
                onClick={() => setShowQuickPost(!showQuickPost)}
                className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-xs font-black text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition-all hover:scale-105"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{showQuickPost ? 'Hide Post Form' : 'Post New Game (Admin)'}</span>
              </button>
            ) : (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 px-4 py-3 text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Global Access
                </div>
                <div className="text-xs font-black text-blue-400 flex items-center justify-end gap-1.5 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Public Arena — Visible to Everyone</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {postSuccess && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-4 text-xs font-bold text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{postSuccess}</span>
        </div>
      )}

      {/* ADMIN POST GAME DIRECT COMPOSER (Requirement: "add where admin can post game, everyone can see it") */}
      {isAdmin && showQuickPost && (
        <div className="rounded-3xl border border-blue-500/40 bg-neutral-900 p-6 shadow-2xl animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs">
                ⚡
              </span>
              <div>
                <h3 className="text-base font-black text-white">Post New Game & Prediction</h3>
                <p className="text-xs text-neutral-400">
                  Published games immediately appear at the top for all connected users worldwide.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowQuickPost(false)}
              className="text-neutral-400 hover:text-white text-xs font-bold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleQuickPostSubmit} className="space-y-4">
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
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
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
                  placeholder="e.g. Chelsea"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  League / Competition *
                </label>
                <select
                  value={league}
                  onChange={e => setLeague(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-400 focus:outline-none"
                >
                  <option value="English Premier League">English Premier League</option>
                  <option value="Spanish La Liga">Spanish La Liga</option>
                  <option value="UEFA Champions League">UEFA Champions League</option>
                  <option value="Italian Serie A">Italian Serie A</option>
                  <option value="German Bundesliga">German Bundesliga</option>
                  <option value="French Ligue 1">French Ligue 1</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Kickoff Date / Time
                </label>
                <input
                  type="datetime-local"
                  value={kickoffTime}
                  onChange={e => setKickoffTime(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:border-blue-400 focus:outline-none"
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
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Prediction Tip *
                </label>
                <input
                  type="text"
                  required
                  value={predictionTip}
                  onChange={e => setPredictionTip(e.target.value)}
                  placeholder="e.g. Home Win & Over 1.5 Goals"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
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
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                Tactical Match Analysis & Probability Rationale
              </label>
              <textarea
                rows={2}
                required
                value={analysis}
                onChange={e => setAnalysis(e.target.value)}
                placeholder="Highlight Poisson goals expectation, team form, absences, and key factors..."
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={e => setIsPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-950 text-blue-500 focus:ring-blue-400"
                />
                <span className="font-bold flex items-center gap-1">
                  <Pin className="h-3.5 w-3.5 text-blue-400" />
                  Pin to Top as Banker Pick
                </span>
              </label>

              <button
                type="submit"
                disabled={submittingPost}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-black text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-600/30 disabled:opacity-50 text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingPost ? 'Publishing...' : 'Publish Game for Everyone'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/50">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-xs text-neutral-400">Loading verified predictions...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center text-red-400 text-sm">
          <ShieldAlert className="mx-auto mb-1 h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Predictions */}
      {!loading && predictions.length === 0 && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">
          <p>No featured predictions published yet.</p>
          {isAdmin && (
            <button
              onClick={() => setShowQuickPost(true)}
              className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white"
            >
              Post First Game
            </button>
          )}
        </div>
      )}

      {/* PINNED HERO PREDICTIONS */}
      {pinnedPredictions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Pin className="h-3.5 w-3.5 fill-blue-400" />
            <span>PINNED TOP PRIORITY PICKS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pinnedPredictions.map(pred => (
              <PredictionCard
                key={pred.id}
                prediction={pred}
                isAdmin={isAdmin}
                onTogglePin={handleTogglePin}
                onDelete={handleDelete}
                onOpenEdit={openAdminModal}
                onSelectMatchAnalysis={onSelectMatchAnalysis}
              />
            ))}
          </div>
        </div>
      )}

      {/* REGULAR PREDICTIONS */}
      {regularPredictions.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>ALL VERIFIED ARENA PICKS (VISIBLE TO EVERYONE)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {regularPredictions.map(pred => (
              <PredictionCard
                key={pred.id}
                prediction={pred}
                isAdmin={isAdmin}
                onTogglePin={handleTogglePin}
                onDelete={handleDelete}
                onOpenEdit={openAdminModal}
                onSelectMatchAnalysis={onSelectMatchAnalysis}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

interface PredictionCardProps {
  prediction: PredictionPost;
  isAdmin: boolean;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenEdit: () => void;
  onSelectMatchAnalysis?: (home: string, away: string) => void;
}

const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  isAdmin,
  onTogglePin,
  onDelete,
  onSelectMatchAnalysis,
}) => {
  const kickoffDate = new Date(prediction.kickoffTime);
  const formattedTime = isNaN(kickoffDate.getTime())
    ? 'Upcoming Match'
    : kickoffDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  return (
    <div
      className={`relative rounded-3xl border p-5 transition-all duration-300 hover:border-blue-500/50 hover:shadow-xl ${
        prediction.isPinned
          ? 'border-blue-500/40 bg-neutral-900/95 shadow-blue-500/5'
          : 'border-neutral-800 bg-neutral-900/70 hover:bg-neutral-900'
      }`}
    >
      {/* Top badges & Admin Controls */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-neutral-800 px-2.5 py-1 text-[11px] font-bold text-neutral-300 border border-neutral-700">
            {prediction.league}
          </span>
          {prediction.isPinned && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white">
              <Pin className="h-3 w-3 fill-white" />
              PINNED
            </span>
          )}
          <span className="rounded-lg bg-neutral-950 px-2 py-0.5 text-[10px] font-semibold text-neutral-400 border border-neutral-800">
            {prediction.marketType}
          </span>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onTogglePin(prediction.id)}
              title={prediction.isPinned ? 'Unpin' : 'Pin to top'}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-blue-400 transition-colors"
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(prediction.id)}
              title="Delete Prediction"
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Match Matchup Headline */}
      <div className="mb-4">
        <div className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-between gap-2">
          <span>{prediction.homeTeam}</span>
          <span className="text-blue-400 font-extrabold text-sm px-2 py-1 rounded bg-neutral-950 border border-neutral-800">
            VS
          </span>
          <span>{prediction.awayTeam}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
          <Clock className="h-3.5 w-3.5 text-neutral-500" />
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* Prediction Tip Box (Highlight) */}
      <div className="mb-4 rounded-2xl border border-blue-500/30 bg-neutral-950 p-4">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Recommended Tip
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-blue-400">
            <Percent className="h-3.5 w-3.5" />
            <span>Confidence: {prediction.confidenceScore}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-black text-blue-400 tracking-tight">
            {prediction.predictionTip}
          </div>
          <div className="shrink-0 rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-black text-white shadow-sm">
            @{prediction.odds.toFixed(2)}
          </div>
        </div>

        {/* Confidence progress meter */}
        <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
            style={{ width: `${Math.min(100, Math.max(10, prediction.confidenceScore))}%` }}
          ></div>
        </div>
      </div>

      {/* Tactical Analysis text */}
      <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3 mb-4">
        {prediction.analysis}
      </p>

      {/* Tags & Action Footer */}
      <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {prediction.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="rounded-md bg-neutral-800/80 px-2 py-0.5 text-[10px] font-medium text-neutral-400"
            >
              #{tag}
            </span>
          ))}
        </div>

        {onSelectMatchAnalysis && (
          <button
            onClick={() => onSelectMatchAnalysis(prediction.homeTeam, prediction.awayTeam)}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>xG Poisson Math</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
