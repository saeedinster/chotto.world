import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Swords, Target, Flame, Crown, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PlayerBattleStats, BattleMatch } from '../../types/battle';

interface BattleStatsProps {
  onBack: () => void;
  userId: string;
}

export function BattleStats({ onBack, userId }: BattleStatsProps) {
  const [stats, setStats] = useState<PlayerBattleStats | null>(null);
  const [recentMatches, setRecentMatches] = useState<BattleMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      const [statsRes, matchesRes] = await Promise.all([
        supabase
          .from('player_battle_stats')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('battle_matches')
          .select('*')
          .eq('player_id', userId)
          .order('played_at', { ascending: false })
          .limit(10)
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (matchesRes.data) setRecentMatches(matchesRes.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getArenaName = (level: number) => {
    const arenas = [
      'Training Ground',
      'Enchanted Forest',
      'Crystal Mountains',
      'Mystic Valley',
      'Dragon Peak',
      'Rainbow Kingdom'
    ];
    return arenas[level] || arenas[arenas.length - 1];
  };

  const getWinRate = () => {
    if (!stats || stats.total_wins + stats.total_losses === 0) return 0;
    return Math.round((stats.total_wins / (stats.total_wins + stats.total_losses)) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading battle stats...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-4">
        <div className="max-w-4xl mx-auto">
          <button onClick={onBack} className="mb-4 px-4 py-2 bg-white rounded-lg flex items-center gap-2 shadow-md">
            <ArrowLeft size={20} />
            Back to Games
          </button>
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">⚔️</div>
            <h2 className="text-2xl font-bold mb-4">No Battle Stats Yet!</h2>
            <p className="text-gray-600 mb-6">Play your first battle to start tracking your progress!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto">
        <button onClick={onBack} className="mb-4 px-4 py-2 bg-white rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow">
          <ArrowLeft size={20} />
          Back to Games
        </button>

        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Battle Statistics
          </h1>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={24} />
                <span className="text-sm font-bold">Trophies</span>
              </div>
              <div className="text-3xl font-bold">{stats.trophies}</div>
              <div className="text-xs opacity-90">Best: {stats.highest_trophies}</div>
            </div>

            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Target size={24} />
                <span className="text-sm font-bold">Win Rate</span>
              </div>
              <div className="text-3xl font-bold">{getWinRate()}%</div>
              <div className="text-xs opacity-90">
                {stats.total_wins}W / {stats.total_losses}L
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-400 to-pink-500 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Flame size={24} />
                <span className="text-sm font-bold">Win Streak</span>
              </div>
              <div className="text-3xl font-bold">{stats.win_streak}</div>
              <div className="text-xs opacity-90">Best: {stats.best_win_streak}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Crown size={24} />
                <span className="text-sm font-bold">Arena</span>
              </div>
              <div className="text-xl font-bold">{getArenaName(stats.arena_level)}</div>
              <div className="text-xs opacity-90">Level {stats.arena_level}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Swords className="text-blue-600" size={20} />
                <span className="font-bold text-blue-900">Total Battles</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.total_wins + stats.total_losses + stats.total_draws}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-green-600" size={20} />
                <span className="font-bold text-green-900">Total Wins</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.total_wins}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="text-purple-600" size={20} />
                <span className="font-bold text-purple-900">Cards Unlocked</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{stats.total_cards_unlocked}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Recent Battles</h2>

          {recentMatches.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Swords size={48} className="mx-auto mb-2 opacity-50" />
              <p>No battles yet. Start your first match!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMatches.map((match) => {
                const isWin = match.result === 'win';
                const isDraw = match.result === 'draw';

                return (
                  <div
                    key={match.id}
                    className={`rounded-lg p-4 border-2 ${
                      isWin
                        ? 'bg-green-50 border-green-300'
                        : isDraw
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-red-50 border-red-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">
                          {isWin ? '🎉' : isDraw ? '🤝' : '💔'}
                        </div>
                        <div>
                          <div className={`font-bold ${
                            isWin ? 'text-green-700' : isDraw ? 'text-gray-700' : 'text-red-700'
                          }`}>
                            {isWin ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}
                          </div>
                          <div className="text-sm text-gray-600">
                            vs AI • {Math.floor(match.duration_seconds / 60)}:{String(match.duration_seconds % 60).padStart(2, '0')}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-bold text-lg ${
                          isWin ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isWin ? '+' : '-'}{isWin ? match.trophies_gained : match.trophies_lost}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <Trophy size={12} />
                          Trophies
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 mt-6 text-white shadow-lg text-center">
          <h3 className="text-2xl font-bold mb-2">Keep Battling!</h3>
          <p className="opacity-90 mb-4">
            Win battles to earn trophies and unlock new arenas with powerful cards!
          </p>
          <div className="flex items-center justify-center gap-2">
            <Crown size={24} />
            <span className="font-bold">Next Arena: {getArenaName(stats.arena_level + 1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
