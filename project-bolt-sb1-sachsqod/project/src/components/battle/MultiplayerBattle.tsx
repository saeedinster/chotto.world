import React, { useState, useEffect } from 'react';
import { Trophy, Zap, Heart, ArrowLeft, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BattleCard, PlayerCard } from '../../types/battle';

interface MultiplayerBattleProps {
  matchId: string;
  userId: string;
  opponentId: string;
  onBack: () => void;
}

interface LiveMatch {
  id: string;
  player1_id: string;
  player2_id: string;
  current_turn: string;
  turn_number: number;
  game_state: any;
  player1_health: number;
  player2_health: number;
  player1_elixir: number;
  player2_elixir: number;
  status: string;
  winner_id: string | null;
}

export function MultiplayerBattle({ matchId, userId, opponentId, onBack }: MultiplayerBattleProps) {
  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [playerDeck, setPlayerDeck] = useState<(PlayerCard & { card: BattleCard })[]>([]);
  const [opponentName, setOpponentName] = useState('Opponent');
  const [battleLog, setBattleLog] = useState<string[]>(['Battle started!']);
  const [selectedEmote, setSelectedEmote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isMyTurn = match?.current_turn === userId;
  const isPlayer1 = match?.player1_id === userId;
  const myHealth = isPlayer1 ? match?.player1_health : match?.player2_health;
  const opponentHealth = isPlayer1 ? match?.player2_health : match?.player1_health;
  const myElixir = isPlayer1 ? match?.player1_elixir : match?.player2_elixir;

  useEffect(() => {
    loadMatchData();
    subscribeToMatch();
    subscribeToEmotes();
  }, [matchId]);

  const loadMatchData = async () => {
    try {
      const [matchRes, cardsRes, profileRes] = await Promise.all([
        supabase.from('battle_live_matches').select('*').eq('id', matchId).single(),
        supabase.from('player_cards').select('*, card:battle_cards(*)').eq('user_id', userId).limit(8),
        supabase.from('user_profiles').select('display_name').eq('id', opponentId).maybeSingle()
      ]);

      if (matchRes.data) setMatch(matchRes.data);
      if (cardsRes.data) setPlayerDeck(cardsRes.data as any);
      if (profileRes.data) setOpponentName(profileRes.data.display_name || 'Opponent');

      setLoading(false);
    } catch (error) {
      console.error('Error loading match:', error);
      setLoading(false);
    }
  };

  const subscribeToMatch = () => {
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'battle_live_matches',
          filter: `id=eq.${matchId}`
        },
        (payload) => {
          const updated = payload.new as LiveMatch;
          setMatch(updated);

          if (updated.status === 'completed') {
            handleGameOver(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToEmotes = () => {
    const channel = supabase
      .channel(`emotes:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'battle_emotes',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          const emote = payload.new;
          if (emote.user_id !== userId) {
            showEmoteNotification(emote.emote_emoji);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const playCard = async (playerCard: PlayerCard & { card: BattleCard }) => {
    if (!match || !isMyTurn) return;

    const card = playerCard.card;
    if ((myElixir || 0) < card.cost) {
      addLog('Not enough elixir!');
      return;
    }

    try {
      const newGameState = { ...match.game_state };
      const units = newGameState.units || [];

      const newHealth = isPlayer1 ? match.player2_health : match.player1_health;
      let healthChange = 0;

      if (card.card_type === 'spell') {
        healthChange = -card.attack;
        addLog(`${card.emoji} ${card.name} dealt ${card.attack} damage!`);
      } else {
        units.push({
          id: `${Date.now()}-${userId}`,
          cardId: card.id,
          cardName: card.name,
          emoji: card.emoji,
          team: userId,
          health: card.health * playerCard.level,
          attack: card.attack * playerCard.level
        });
        addLog(`Played ${card.emoji} ${card.name}!`);
      }

      const newElixir = (myElixir || 0) - card.cost;
      const nextTurn = opponentId;
      const updatedHealth = Math.max(0, newHealth + healthChange);

      const updates: any = {
        current_turn: nextTurn,
        turn_number: match.turn_number + 1,
        game_state: newGameState,
        last_action_at: new Date().toISOString()
      };

      if (isPlayer1) {
        updates.player1_elixir = newElixir;
        updates.player2_health = updatedHealth;
        updates.player2_elixir = Math.min(10, (match.player2_elixir || 0) + 2);
      } else {
        updates.player2_elixir = newElixir;
        updates.player1_health = updatedHealth;
        updates.player1_elixir = Math.min(10, (match.player1_elixir || 0) + 2);
      }

      if (updatedHealth <= 0) {
        updates.status = 'completed';
        updates.winner_id = userId;
        updates.completed_at = new Date().toISOString();
      }

      await supabase.from('battle_live_matches').update(updates).eq('id', matchId);
    } catch (error) {
      console.error('Error playing card:', error);
    }
  };

  const sendEmote = async (emoteType: string, emoji: string) => {
    try {
      await supabase.from('battle_emotes').insert({
        match_id: matchId,
        user_id: userId,
        emote_type: emoteType,
        emote_emoji: emoji
      });
      setSelectedEmote(null);
    } catch (error) {
      console.error('Error sending emote:', error);
    }
  };

  const showEmoteNotification = (emoji: string) => {
    addLog(`Opponent sent: ${emoji}`);
  };

  const handleGameOver = async (finalMatch: LiveMatch) => {
    const isWinner = finalMatch.winner_id === userId;
    const trophyChange = isWinner ? 30 : -15;

    addLog(isWinner ? '🎉 VICTORY!' : '💔 DEFEAT!');

    try {
      await supabase.from('battle_matches').insert({
        player_id: userId,
        opponent_type: 'player',
        opponent_id: opponentId,
        result: isWinner ? 'win' : 'loss',
        trophies_gained: isWinner ? 30 : 0,
        trophies_lost: isWinner ? 0 : 15,
        duration_seconds: finalMatch.turn_number * 30
      });

      const { data: stats } = await supabase
        .from('player_battle_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (stats) {
        await supabase
          .from('player_battle_stats')
          .update({
            trophies: Math.max(0, stats.trophies + trophyChange),
            total_wins: stats.total_wins + (isWinner ? 1 : 0),
            total_losses: stats.total_losses + (isWinner ? 0 : 1),
            win_streak: isWinner ? stats.win_streak + 1 : 0,
            best_win_streak: isWinner ? Math.max(stats.best_win_streak, stats.win_streak + 1) : stats.best_win_streak,
            highest_trophies: Math.max(stats.highest_trophies, stats.trophies + trophyChange),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  const addLog = (message: string) => {
    setBattleLog(prev => [...prev.slice(-4), message]);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const emotes = [
    { type: 'happy', emoji: '😊', label: 'Happy' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'good_game', emoji: '👍', label: 'Good Game' },
    { type: 'well_played', emoji: '⭐', label: 'Well Played' },
    { type: 'oops', emoji: '😅', label: 'Oops' },
    { type: 'thanks', emoji: '🙏', label: 'Thanks' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading battle...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-xl mb-4">Match not found</p>
          <button onClick={onBack} className="px-6 py-3 bg-blue-500 text-white rounded-lg font-bold">
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto">
        <button onClick={onBack} className="mb-4 px-4 py-2 bg-white rounded-lg flex items-center gap-2 shadow-md">
          <ArrowLeft size={20} />
          Leave Battle
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">{opponentName}</span>
              <div className="flex items-center gap-2">
                <Heart size={20} />
                <span className="text-xl font-bold">{opponentHealth}</span>
              </div>
            </div>
            <div className="text-xs opacity-90">
              {!isMyTurn && '⏳ Their Turn'}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">YOU</span>
              <div className="flex items-center gap-2">
                <Heart size={20} />
                <span className="text-xl font-bold">{myHealth}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-yellow-300" />
              <div className="flex-1 bg-white/30 rounded-full h-3">
                <div
                  className="bg-yellow-300 h-full rounded-full transition-all"
                  style={{ width: `${((myElixir || 0) / 10) * 100}%` }}
                />
              </div>
              <span className="font-bold">{myElixir}</span>
            </div>
          </div>
        </div>

        {match.status === 'completed' && (
          <div className="bg-white rounded-xl p-6 mb-4 text-center shadow-lg">
            <div className="text-6xl mb-3">{match.winner_id === userId ? '🎉' : '💔'}</div>
            <h2 className="text-3xl font-bold mb-2">
              {match.winner_id === userId ? 'VICTORY!' : 'DEFEAT!'}
            </h2>
            <p className="text-gray-600 mb-4">
              {match.winner_id === userId ? '+30 Trophies' : '-15 Trophies'}
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:scale-105 transition-transform"
            >
              Back to Menu
            </button>
          </div>
        )}

        <div className="bg-gradient-to-b from-green-600 to-green-800 rounded-xl p-6 mb-4 shadow-lg min-h-[300px] relative">
          <div className="text-white text-center mb-2 font-bold">
            {isMyTurn ? '⚡ Your Turn!' : '⏳ Waiting for opponent...'}
          </div>

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="text-white text-center">
              <div className="text-4xl mb-2">⚔️</div>
              <div className="text-sm opacity-80">Turn {match.turn_number}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 mb-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">Battle Log</h3>
            <button
              onClick={() => setSelectedEmote(selectedEmote ? null : 'show')}
              className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-sm font-bold hover:bg-yellow-600"
            >
              😊 Emotes
            </button>
          </div>
          <div className="space-y-1 h-20 overflow-y-auto">
            {battleLog.map((log, i) => (
              <div key={i} className="text-sm text-gray-700">{log}</div>
            ))}
          </div>

          {selectedEmote && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {emotes.map((emote) => (
                <button
                  key={emote.type}
                  onClick={() => sendEmote(emote.type, emote.emoji)}
                  className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg hover:scale-105 transition-transform"
                >
                  <div className="text-2xl mb-1">{emote.emoji}</div>
                  <div className="text-xs font-bold text-gray-700">{emote.label}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg">
          <h3 className="font-bold mb-3">Your Cards</h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {playerDeck.map((playerCard) => {
              const card = playerCard.card;
              const canPlay = isMyTurn && (myElixir || 0) >= card.cost && match.status === 'active';

              return (
                <button
                  key={playerCard.id}
                  onClick={() => canPlay && playCard(playerCard)}
                  disabled={!canPlay}
                  className={`bg-gradient-to-br ${getRarityColor(card.rarity)} rounded-lg p-3 text-white transition-all ${
                    canPlay ? 'hover:scale-110 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="text-3xl mb-1">{card.emoji}</div>
                  <div className="text-xs font-bold truncate">{card.name}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Zap size={12} />
                    <span className="text-xs font-bold">{card.cost}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
