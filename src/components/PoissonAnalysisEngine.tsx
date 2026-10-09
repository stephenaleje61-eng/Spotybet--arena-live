import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { MatchAnalysis, SportsMatch } from '../types';
import {
  Calculator,
  Percent,
  TrendingUp,
  Shield,
  HelpCircle,
  Clock,
  Database,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface PoissonAnalysisEngineProps {
  initialHome?: string;
  initialAway?: string;
  initialMatchId?: string;
}

export const PoissonAnalysisEngine: React.FC<PoissonAnalysisEngineProps> = ({
  initialHome,
  initialAway,
  initialMatchId,
}) => {
  const [fixtures, setFixtures] = useState<SportsMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(initialMatchId || 'sp_pl_01');
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFixtures = async () => {
      try {
        const res = await api.getFixtures('4328');
        setFixtures(res.matches);
        if (!initialMatchId && res.matches.length > 0) {
          setSelectedMatchId(res.matches[0].id);
        }
      } catch (err) {
        console.error('Error loading fixtures:', err);
      }
    };
    loadFixtures();
  }, [initialMatchId]);

  useEffect(() => {
    const loadAnalysis = async () => {
      if (!selectedMatchId) return;
      setLoading(true);
      try {
        const res = await api.getMatchAnalysis(selectedMatchId);
        setAnalysis(res.analysis);
      } catch (err) {
        console.error('Error loading analysis:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalysis();
  }, [selectedMatchId]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-r from-neutral-950 via-neutral-900 to-black p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-400">
              <Calculator className="h-4 w-4" />
              <span>MATHEMATICAL MODELING CORE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              POISSON xG <span className="text-blue-400">PREDICTION ENGINE</span>
            </h2>
            <p className="max-w-2xl text-xs sm:text-sm text-neutral-300">
              Documented statistical modeling based on Dixon-Coles Bivariate Poisson goal distribution,
              weighted form factors, and home ground expectancy differential.
            </p>
          </div>

          <div className="w-full md:w-72">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Select Match for Calculation
            </label>
            <select
              value={selectedMatchId}
              onChange={e => setSelectedMatchId(e.target.value)}
              className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-xs font-bold text-white focus:border-blue-400 focus:outline-none"
            >
              {fixtures.map(f => (
                <option key={f.id} value={f.id}>
                  {f.homeTeam} vs {f.awayTeam}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Model Mathematical Documentation Box */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Documented Statistical Methodology
          </h3>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed mb-3">
          Our algorithm determines match probability distributions using calibrated Poisson probability mass functions:
        </p>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-xs text-blue-400 overflow-x-auto text-center">
          P(X = k; λ) = (λ^k · e^(-λ)) / k! &nbsp;|&nbsp; λ_home = 1.35 · Attack_home · Defense_away · 1.18 (Pitch Advantage)
        </div>
        <p className="text-[11px] text-neutral-400 mt-3 leading-relaxed">
          Joint outcomes are modeled across a 7x7 goal expectation matrix to calculate clean Home Win, Draw, and Away Win probabilities and fair decimal value odds.
        </p>
      </div>

      {loading || !analysis ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-900">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-xs text-neutral-400">Computing Poisson differential equations...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Probabilities Banner */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 sm:p-8">
            <div className="text-center mb-6">
              <span className="rounded-lg bg-neutral-800 px-3 py-1 text-xs font-bold text-neutral-400">
                {analysis.league}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-2">
                {analysis.homeTeam} <span className="text-blue-400 font-light mx-2">vs</span> {analysis.awayTeam}
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Estimated Match Probability Distribution
              </p>
            </div>

            {/* Probability Bars (Home Win, Draw, Away Win) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 text-center">
                <div className="text-xs font-bold uppercase text-neutral-400 mb-1">
                  {analysis.homeTeam} Win
                </div>
                <div className="text-4xl font-black text-blue-400 font-mono">
                  {analysis.probabilities.homeWin}%
                </div>
                <div className="mt-2 text-[11px] text-neutral-500 font-mono">
                  Fair Odds: @{analysis.fairOdds.homeWin.toFixed(2)}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 text-center">
                <div className="text-xs font-bold uppercase text-neutral-400 mb-1">
                  Draw (Stalemate)
                </div>
                <div className="text-4xl font-black text-white font-mono">
                  {analysis.probabilities.draw}%
                </div>
                <div className="mt-2 text-[11px] text-neutral-500 font-mono">
                  Fair Odds: @{analysis.fairOdds.draw.toFixed(2)}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 text-center">
                <div className="text-xs font-bold uppercase text-neutral-400 mb-1">
                  {analysis.awayTeam} Win
                </div>
                <div className="text-4xl font-black text-neutral-300 font-mono">
                  {analysis.probabilities.awayWin}%
                </div>
                <div className="mt-2 text-[11px] text-neutral-500 font-mono">
                  Fair Odds: @{analysis.fairOdds.awayWin.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Composite Visual Bar */}
            <div className="h-4 w-full rounded-full bg-neutral-950 p-0.5 border border-neutral-800 flex overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-l-full transition-all"
                style={{ width: `${analysis.probabilities.homeWin}%` }}
                title={`Home Win: ${analysis.probabilities.homeWin}%`}
              ></div>
              <div
                className="h-full bg-neutral-600 transition-all"
                style={{ width: `${analysis.probabilities.draw}%` }}
                title={`Draw: ${analysis.probabilities.draw}%`}
              ></div>
              <div
                className="h-full bg-neutral-400 rounded-r-full transition-all"
                style={{ width: `${analysis.probabilities.awayWin}%` }}
                title={`Away Win: ${analysis.probabilities.awayWin}%`}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-neutral-500 mt-1 font-mono">
              <span className="text-blue-400 font-bold">{analysis.homeTeam} ({analysis.probabilities.homeWin}%)</span>
              <span className="text-neutral-400">Draw ({analysis.probabilities.draw}%)</span>
              <span className="text-neutral-300">{analysis.awayTeam} ({analysis.probabilities.awayWin}%)</span>
            </div>
          </div>

          {/* Expected Goals (xG) & Exact Scoreline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>Expected Goals Forecast (xG)</span>
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-center">
                  <div className="text-xs text-neutral-400 mb-1">{analysis.homeTeam} xG</div>
                  <div className="font-mono text-3xl font-black text-blue-400">
                    {analysis.homeExpectedGoals}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-1">Projected Goals</div>
                </div>

                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-center">
                  <div className="text-xs text-neutral-400 mb-1">{analysis.awayTeam} xG</div>
                  <div className="font-mono text-3xl font-black text-white">
                    {analysis.awayExpectedGoals}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-1">Projected Goals</div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-center">
                <div className="text-[11px] font-bold uppercase text-neutral-400">
                  Most Likely Matrix Scoreline
                </div>
                <div className="font-mono text-2xl font-black text-white mt-1">
                  {analysis.mostLikelyScoreline.score}
                </div>
                <div className="text-xs text-blue-400 mt-0.5">
                  Single Event Probability: {analysis.mostLikelyScoreline.probability}%
                </div>
              </div>
            </div>

            {/* Performance & Head-to-Head */}
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                <span>Recent Form & Head-to-Head Record</span>
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-neutral-800 pb-2">
                  <span className="text-neutral-400">{analysis.homeTeam} Recent Form:</span>
                  <div className="flex gap-1 font-mono font-bold text-[10px]">
                    {analysis.recentForm.home.split('-').map((ch, i) => (
                      <span
                        key={i}
                        className={`h-5 w-5 rounded flex items-center justify-center ${
                          ch === 'W'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : ch === 'D'
                            ? 'bg-neutral-800 text-neutral-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs border-b border-neutral-800 pb-2">
                  <span className="text-neutral-400">{analysis.awayTeam} Recent Form:</span>
                  <div className="flex gap-1 font-mono font-bold text-[10px]">
                    {analysis.recentForm.away.split('-').map((ch, i) => (
                      <span
                        key={i}
                        className={`h-5 w-5 rounded flex items-center justify-center ${
                          ch === 'W'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : ch === 'D'
                            ? 'bg-neutral-800 text-neutral-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs border-b border-neutral-800 pb-2">
                  <span className="text-neutral-400">H2H (Last 5 Meetings):</span>
                  <span className="font-mono text-white font-bold">
                    {analysis.performanceStats.headToHeadHomeWins} Wins / {analysis.performanceStats.headToHeadDraws} Draws / {analysis.performanceStats.headToHeadAwayWins} Losses
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Average Goals / Game:</span>
                  <span className="font-mono text-neutral-200">
                    {analysis.performanceStats.homeAverageScored} scored vs {analysis.performanceStats.awayAverageScored} conceded
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Influencing Factors */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6">
            <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 mb-4">
              Tactical & Statistical Influencing Factors
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analysis.influencingFactors.map((f, i) => (
                <div key={i} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        f.impact === 'positive'
                          ? 'bg-emerald-400'
                          : f.impact === 'negative'
                          ? 'bg-red-400'
                          : 'bg-neutral-500'
                      }`}
                    ></span>
                    <span className="text-xs font-bold text-white">{f.factor}</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mathematical Disclaimer & Meta Notice */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-400 shrink-0" />
              <span>{analysis.disclaimer}</span>
            </div>
            <div className="text-[11px] text-neutral-500 shrink-0">
              Source: {analysis.dataSource} • {new Date(analysis.calculatedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
