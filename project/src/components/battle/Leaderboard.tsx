import React, { useState, useEffect } from 'react';
import { Trophy, Crown, TrendingUp, Medal, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  display_name: string;
  rank: number;
  trophies: number;
  arena_level: number;
  total_wins: number;
  win_streak: number;
}

interface LeaderboardProps {
  onBack: () => void;
  userId: string | null;
}

export function Leaderboard({ onBack, userId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [userId]);

  const loadLeaderboard = async () => {
    try {
      const { data: entries } = await supabase
        .from('battle_leaderboards')
        .select('*')
        .order('trophies', { ascending: false })
        .limit(100);

      if (entries) {
        const ranked = entries.map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));
        setLeaderboard(ranked);

        if (userId) {
          const userEntry = ranked.find(e => e.user_id === userId);
          if (userEntry) {
            setMyRank(userEntry);
          } else {
            await loadUserRank();
          }
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRank = async () => {
    if (!userId) return;

    try {
      const { data: stats } = await supabase
        .from('player_battle_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (stats) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('id', userId)
          .maybeSingle();

        const { count } = await supabase
          .from('battle_leaderboards')
          .select('*', { count: 'exact', head: true })
          .gt('trophies', stats.trophies);

        const rank = (count || 0) + 1;

        setMyRank({
          id: stats.id,
          user_id: userId,
          display_name: profile?.display_name || 'You',
          rank,
          trophies: stats.trophies,
          arena_level: stats.arena_level,
          total_wins: stats.total_wins,
          win_streak: stats.win_streak
        });
      }
    } catch (error) {
      console.error('Error loading user rank:', error);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-orange-500';
    if (rank === 2) return 'from-gray-300 to-gray-400';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    if (rank <= 10) return 'from-purple-400 to-pink-500';
    return 'from-blue-400 to-cyan-500';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '⭐';
    return '🏆';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-4 px-4 py-2 bg-white rounded-lg flex items-center gap-2 shadow-md">
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="text-yellow-500" size={40} />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
              Leaderboard
            </h1>
            <Trophy className="text-yellow-500" size={40} />
          </div>
          <p className="text-center text-gray-600">Top players in Story Battle Arena</p>
        </div>

        {myRank && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 mb-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{getRankIcon(myRank.rank)}</div>
                <div>
                  <div className="text-sm opacity-90">Your Rank</div>
                  <div className="text-3xl font-bold">#{myRank.rank}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <Trophy size={20} />
                  <span className="text-2xl font-bold">{myRank.trophies}</span>
                </div>
                <div className="text-sm opacity-90">{myRank.total_wins} Wins</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
            <h2 className="text-2xl font-bold text-center">Top 100 Players</h2>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Trophy size={48} className="mx-auto mb-2 opacity-50" />
              <p>No players on leaderboard yet. Be the first!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {leaderboard.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    entry.user_id === userId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-16 text-center">
                      {entry.rank <= 3 ? (
                        <div className="text-4xl">{getRankIcon(entry.rank)}</div>
                      ) : (
                        <div className="text-2xl font-bold text-gray-600">#{entry.rank}</div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg text-gray-800">
                          {entry.display_name}
                        </span>
                        {entry.user_id === userId && (
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {getArenaName(entry.arena_level)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <Trophy className="text-yellow-500" size={18} />
                        <span className="text-xl font-bold text-gray-800">{entry.trophies}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {entry.total_wins} wins
                      </div>
                      {entry.win_streak > 2 && (
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <TrendingUp size={14} className="text-orange-500" />
                          <span className="text-xs font-bold text-orange-600">
                            {entry.win_streak} streak
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 mt-6 text-white shadow-lg text-center">
          <Crown className="mx-auto mb-3" size={40} />
          <h3 className="text-2xl font-bold mb-2">Climb the Ranks!</h3>
          <p className="opacity-90">
            Win battles to earn trophies and reach the top of the leaderboard!
          </p>
        </div>
      </div>
    </div>
  );
}
