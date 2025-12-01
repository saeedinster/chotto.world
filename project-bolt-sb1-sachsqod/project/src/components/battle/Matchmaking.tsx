import React, { useState, useEffect } from 'react';
import { Users, Search, X, Zap, Trophy, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface MatchmakingProps {
  userId: string;
  trophies: number;
  onMatchFound: (matchId: string, opponentId: string) => void;
  onBack: () => void;
}

export function Matchmaking({ userId, trophies, onMatchFound, onBack }: MatchmakingProps) {
  const [searching, setSearching] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (searching) {
      interval = setInterval(() => {
        setQueueTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [searching]);

  useEffect(() => {
    if (searching) {
      const channel = supabase
        .channel('matchmaking')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'battle_matchmaking_queue',
            filter: `user_id=eq.${userId}`
          },
          async (payload) => {
            const queue = payload.new;
            if (queue.status === 'matched' && queue.matched_with) {
              await handleMatchFound(queue.matched_with);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [searching, userId]);

  const startMatchmaking = async () => {
    setSearching(true);
    setError(null);
    setQueueTime(0);

    try {
      await supabase.from('battle_matchmaking_queue').delete().eq('user_id', userId);

      const trophyRange = 200;
      const { error: queueError } = await supabase
        .from('battle_matchmaking_queue')
        .insert({
          user_id: userId,
          trophy_count: trophies,
          trophy_range_min: Math.max(0, trophies - trophyRange),
          trophy_range_max: trophies + trophyRange,
          status: 'waiting'
        });

      if (queueError) throw queueError;

      setTimeout(() => {
        checkForMatch();
      }, 2000);
    } catch (err: any) {
      console.error('Error joining queue:', err);
      setError('Failed to join matchmaking. Please try again.');
      setSearching(false);
    }
  };

  const checkForMatch = async () => {
    try {
      const { data: myQueue } = await supabase
        .from('battle_matchmaking_queue')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'waiting')
        .maybeSingle();

      if (!myQueue) return;

      const { data: opponents } = await supabase
        .from('battle_matchmaking_queue')
        .select('*')
        .neq('user_id', userId)
        .eq('status', 'waiting')
        .gte('trophy_count', myQueue.trophy_range_min)
        .lte('trophy_count', myQueue.trophy_range_max)
        .limit(1);

      if (opponents && opponents.length > 0) {
        const opponent = opponents[0];

        await supabase
          .from('battle_matchmaking_queue')
          .update({ status: 'matched', matched_with: opponent.user_id })
          .eq('user_id', userId);

        await supabase
          .from('battle_matchmaking_queue')
          .update({ status: 'matched', matched_with: userId })
          .eq('user_id', opponent.user_id);

        const { data: match, error: matchError } = await supabase
          .from('battle_live_matches')
          .insert({
            player1_id: userId,
            player2_id: opponent.user_id,
            current_turn: userId,
            game_state: { units: [], log: ['Battle started!'] }
          })
          .select()
          .single();

        if (matchError) throw matchError;

        await supabase.from('battle_matchmaking_queue').delete().eq('user_id', userId);
        await supabase.from('battle_matchmaking_queue').delete().eq('user_id', opponent.user_id);

        onMatchFound(match.id, opponent.user_id);
      } else {
        setTimeout(() => {
          if (searching) checkForMatch();
        }, 3000);
      }
    } catch (err) {
      console.error('Error checking for match:', err);
      setError('Error finding match. Please try again.');
      cancelMatchmaking();
    }
  };

  const handleMatchFound = async (opponentId: string) => {
    const { data: match } = await supabase
      .from('battle_live_matches')
      .select('*')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .eq('status', 'active')
      .maybeSingle();

    if (match) {
      onMatchFound(match.id, opponentId);
    }
  };

  const cancelMatchmaking = async () => {
    try {
      await supabase
        .from('battle_matchmaking_queue')
        .delete()
        .eq('user_id', userId);
      setSearching(false);
      setQueueTime(0);
    } catch (err) {
      console.error('Error cancelling matchmaking:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        {!searching ? (
          <div className="bg-white rounded-xl p-8 shadow-2xl">
            <button
              onClick={onBack}
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚔️</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Find Opponent</h2>
              <p className="text-gray-600">Battle against real players!</p>
            </div>

            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">Your Trophies</span>
                <div className="flex items-center gap-2">
                  <Trophy className="text-yellow-600" size={20} />
                  <span className="text-xl font-bold text-yellow-600">{trophies}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-3 mb-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={startMatchmaking}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-lg flex items-center justify-center gap-2"
            >
              <Search size={24} />
              Start Matchmaking
            </button>

            <div className="mt-6 space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <Zap size={16} className="text-yellow-500" />
                Matched with players near your trophy level
              </p>
              <p className="flex items-center gap-2">
                <Users size={16} className="text-blue-500" />
                Real-time turn-based battles
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-2xl text-center">
            <div className="text-6xl mb-4 animate-bounce">🔍</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Searching for Opponent</h2>

            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-6 mb-6 text-white">
              <div className="text-5xl font-bold mb-2">{queueTime}s</div>
              <div className="text-sm opacity-90">Finding the perfect match...</div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <p className="text-gray-600 text-sm">Searching players with {trophies - 200} - {trophies + 200} trophies</p>
            </div>

            <button
              onClick={cancelMatchmaking}
              className="w-full py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
              <X size={20} />
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
