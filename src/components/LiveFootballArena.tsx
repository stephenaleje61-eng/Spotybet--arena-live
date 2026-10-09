import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { SportsMatch, LeagueStanding } from '../types';
import {
  Radio,
  Search,
  Star,
  RefreshCw,
  Table,
  Calendar,
  Clock,
  ChevronRight,
  Calculator,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface LiveFootballArenaProps {
  onSelectMatchAnalysis: (home: string, away: string, matchId?: string) => void;
}

export const LiveFootballArena: React.FC<LiveFootballArenaProps> = ({ onSelectMatchAnalysis }) => {
  const [leagues, setLeagues] = useState<{ id: string; code: string; name: string; country: string }[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState('4328'); // Premier League
  const [viewMode, setViewMode] = useState<'matches' | 'standings'>('matches');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('safepicks_fav_teams') || '[]');
    } catch {
      return [];
    }
  });

  const [matches, setMatches] = useState<SportsMatch[]>([]);
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState('Official Match Feed');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const res = await api.getLeagues();
        setLeagues(res.leagues);
      } catch (err) {
        console.warn('Leagues load error:', err);
      }
    };
    fetchLeagues();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (viewMode === 'matches') {
        const res = await api.getFixtures(selectedLeagueId);
        setMatches(res.matches);
        setDataSource(res.source);
        setLastUpdated(res.lastUpdated);
      } else {
        const res = await api.getStandings(selectedLeagueId);
        setStandings(res.standings);
        setDataSource(res.source);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve sports data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedLeagueId, viewMode]);

  const toggleFavorite = (team: string) => {
    const next = favorites.includes(team) ? favorites.filter(t => t !== team) : [...favorites, team];
    setFavorites(next);
    localStorage.setItem('safepicks_fav_teams', JSON.stringify(next));
  };

  const filteredMatches = matches.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.homeTeam.toLowerCase().includes(q) ||
      m.awayTeam.toLowerCase().includes(q) ||
      (m.venue && m.venue.toLowerCase().includes(q))
    );
  });

  const filteredStandings = standings.filter(s => {
    if (!searchQuery) return true;
    return s.team.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-2">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>LIVE SPORTS ENGINE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">WORLD FOOTBALL ARENA</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Live match fixtures, verified results, official standings, and instant Poisson probability analysis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('matches')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                viewMode === 'matches'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Fixtures & Scores</span>
            </button>
            <button
              onClick={() => setViewMode('standings')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                viewMode === 'standings'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Standings Table</span>
            </button>
            <button
              onClick={fetchData}
              title="Refresh Sports Data"
              className="rounded-xl border border-neutral-700 bg-neutral-800 p-2.5 text-neutral-300 hover:text-blue-400 hover:border-blue-400/50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* League Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {leagues.map(l => (
            <button
              key={l.id}
              onClick={() => setSelectedLeagueId(l.id)}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                selectedLeagueId === l.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'border border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>

        {/* Search & Meta Bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-800">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search club or team..."
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Feed: {dataSource}</span>
            {lastUpdated && <span>• Synced: {new Date(lastUpdated).toLocaleTimeString()}</span>}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center text-red-400 text-sm">
          <ShieldAlert className="mx-auto mb-1 h-5 w-5" />
          <span>{error}</span>
          <div className="mt-2">
            <button
              onClick={fetchData}
              className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300 hover:bg-red-500/30"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-56 items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-900/40">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-xs text-neutral-400">Fetching live sports data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* VIEW MODE: MATCHES */}
          {viewMode === 'matches' && (
            <div className="space-y-4">
              {filteredMatches.length === 0 ? (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400 text-sm">
                  No fixtures found for this query or league.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMatches.map(m => {
                    const isFavHome = favorites.includes(m.homeTeam);
                    const isFavAway = favorites.includes(m.awayTeam);
                    const isFav = isFavHome || isFavAway;
                    const isFinished = m.status === 'FINISHED';
                    const isLive = m.status === 'LIVE' || m.status === 'IN_PLAY';

                    const kickoff = new Date(m.kickoffTime);
                    const dateFormatted = isNaN(kickoff.getTime())
                      ? 'Scheduled'
                      : kickoff.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                    return (
                      <div
                        key={m.id}
                        className={`group rounded-3xl border p-5 transition-all duration-200 hover:border-blue-400/50 hover:bg-neutral-900 ${
                          isFav
                            ? 'border-blue-500/40 bg-neutral-900/90 shadow-lg shadow-blue-500/5'
                            : 'border-neutral-800 bg-neutral-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
                              {m.round || m.leagueName}
                            </span>
                            {isLive && (
                              <span className="flex items-center gap-1 rounded-lg bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-bold text-red-400 animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>
                                LIVE
                              </span>
                            )}
                            {isFinished && (
                              <span className="rounded-lg bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
                                FT Result
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleFavorite(m.homeTeam)}
                              title="Favorite Home Team"
                              className={`p-1 transition-colors ${
                                isFav ? 'text-blue-400' : 'text-neutral-600 hover:text-neutral-400'
                              }`}
                            >
                              <Star className={`h-4 w-4 ${isFav ? 'fill-blue-400' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Match details & Scores */}
                        <div className="grid grid-cols-12 items-center gap-2 my-2">
                          <div className="col-span-5 flex items-center justify-end gap-2 text-right">
                            <span className="text-sm sm:text-base font-black text-white group-hover:text-blue-400 transition-colors">
                              {m.homeTeam}
                            </span>
                          </div>

                          <div className="col-span-2 text-center">
                            {isFinished || isLive ? (
                              <div className="rounded-xl bg-neutral-950 border border-neutral-800 py-1 px-2 font-mono font-black text-lg text-blue-400 shadow-inner">
                                {m.homeScore ?? 0} - {m.awayScore ?? 0}
                              </div>
                            ) : (
                              <span className="rounded-lg bg-neutral-950 px-2 py-1 text-xs font-extrabold text-neutral-400 border border-neutral-800">
                                VS
                              </span>
                            )}
                          </div>

                          <div className="col-span-5 flex items-center justify-start gap-2 text-left">
                            <span className="text-sm sm:text-base font-black text-white group-hover:text-blue-400 transition-colors">
                              {m.awayTeam}
                            </span>
                          </div>
                        </div>

                        {/* Kickoff / Venue */}
                        <div className="mt-3 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800/80 pt-3">
                          <div className="flex items-center gap-1.5 text-neutral-400">
                            <Clock className="w-3.5 h-3.5 text-neutral-500" />
                            <span>{dateFormatted}</span>
                          </div>

                          <button
                            onClick={() => onSelectMatchAnalysis(m.homeTeam, m.awayTeam, m.id)}
                            className="flex items-center gap-1 rounded-xl bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs font-bold text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Poisson xG Analysis</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE: STANDINGS */}
          {viewMode === 'standings' && (
            <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-neutral-300">
                  <thead className="bg-neutral-950 text-xs uppercase font-bold text-neutral-400 border-b border-neutral-800">
                    <tr>
                      <th className="px-4 py-3.5 w-12 text-center">Pos</th>
                      <th className="px-4 py-3.5">Club</th>
                      <th className="px-3 py-3.5 text-center">P</th>
                      <th className="px-3 py-3.5 text-center">W</th>
                      <th className="px-3 py-3.5 text-center">D</th>
                      <th className="px-3 py-3.5 text-center">L</th>
                      <th className="px-3 py-3.5 text-center hidden sm:table-cell">GF</th>
                      <th className="px-3 py-3.5 text-center hidden sm:table-cell">GA</th>
                      <th className="px-3 py-3.5 text-center">GD</th>
                      <th className="px-4 py-3.5 text-center font-black text-blue-400">PTS</th>
                      <th className="px-4 py-3.5 text-center hidden md:table-cell">Form</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-medium">
                    {filteredStandings.map(row => (
                      <tr
                        key={row.position}
                        className="hover:bg-neutral-800/40 transition-colors group"
                      >
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                              row.position <= 4
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                                : 'text-neutral-400'
                            }`}
                          >
                            {row.position}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-white group-hover:text-blue-400 transition-colors">
                          {row.team}
                        </td>
                        <td className="px-3 py-3 text-center text-neutral-400">{row.played}</td>
                        <td className="px-3 py-3 text-center text-neutral-300">{row.won}</td>
                        <td className="px-3 py-3 text-center text-neutral-400">{row.drawn}</td>
                        <td className="px-3 py-3 text-center text-neutral-400">{row.lost}</td>
                        <td className="px-3 py-3 text-center text-neutral-400 hidden sm:table-cell">
                          {row.goalsFor}
                        </td>
                        <td className="px-3 py-3 text-center text-neutral-400 hidden sm:table-cell">
                          {row.goalsAgainst}
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-neutral-300">
                          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                        <td className="px-4 py-3 text-center font-black text-blue-400 text-base">
                          {row.points}
                        </td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">
                          {row.form ? (
                            <div className="flex items-center justify-center gap-1 font-mono text-[10px] font-bold">
                              {row.form.split('').map((ch, i) => (
                                <span
                                  key={i}
                                  className={`h-5 w-5 rounded flex items-center justify-center ${
                                    ch === 'W'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : ch === 'D'
                                      ? 'bg-neutral-800 text-neutral-400'
                                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  }`}
                                >
                                  {ch}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-neutral-600">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
