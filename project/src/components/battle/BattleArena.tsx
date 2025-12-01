import React, { useState, useEffect } from 'react';
import { Trophy, Zap, Heart, Swords, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BattleCard, BattleState, BattleUnit, PlayerCard } from '../../types/battle';

interface BattleArenaProps {
  onBack: () => void;
  userId: string;
}

export function BattleArena({ onBack, userId }: BattleArenaProps) {
  const [playerDeck, setPlayerDeck] = useState<(PlayerCard & { card: BattleCard })[]>([]);
  const [battleState, setBattleState] = useState<BattleState>({
    playerHealth: 1000,
    opponentHealth: 1000,
    playerElixir: 10,
    opponentElixir: 10,
    turn: 'player',
    units: [],
    round: 1,
    isGameOver: false,
    winner: null
  });
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>(['Battle started!']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayerDeck();
  }, [userId]);

  const loadPlayerDeck = async () => {
    try {
      const { data: cards } = await supabase
        .from('player_cards')
        .select(`
          *,
          card:battle_cards(*)
        `)
        .eq('user_id', userId)
        .limit(8);

      if (cards) {
        setPlayerDeck(cards as any);
      }
    } catch (error) {
      console.error('Error loading deck:', error);
    } finally {
      setLoading(false);
    }
  };

  const playCard = (playerCard: PlayerCard & { card: BattleCard }, position: number) => {
    const card = playerCard.card;

    if (battleState.turn !== 'player') return;
    if (battleState.playerElixir < card.cost) {
      addToBattleLog('Not enough elixir!');
      return;
    }

    // Deduct elixir
    const newState = { ...battleState };
    newState.playerElixir -= card.cost;

    if (card.card_type === 'spell') {
      // Apply spell effect
      handleSpellCard(card, newState);
    } else {
      // Spawn unit
      const newUnit: BattleUnit = {
        id: `unit-${Date.now()}-${Math.random()}`,
        cardId: card.id,
        card: card,
        level: playerCard.level,
        currentHealth: card.health * playerCard.level,
        maxHealth: card.health * playerCard.level,
        position: position,
        team: 'player',
        isDead: false
      };
      newState.units.push(newUnit);
      addToBattleLog(`Played ${card.emoji} ${card.name}!`);
    }

    setBattleState(newState);
    setSelectedCard(null);

    // AI turn after short delay
    setTimeout(() => {
      aiTurn(newState);
    }, 1000);
  };

  const handleSpellCard = (card: BattleCard, state: BattleState) => {
    if (card.name === 'Lightning Bolt') {
      const damage = card.attack;
      state.opponentHealth -= damage;
      addToBattleLog(`⚡ Lightning hit for ${damage} damage!`);
    } else if (card.name === 'Healing Wave') {
      const healAmount = 50;
      state.playerHealth = Math.min(state.playerHealth + healAmount, 1000);
      state.units.forEach(unit => {
        if (unit.team === 'player' && !unit.isDead) {
          unit.currentHealth = Math.min(unit.currentHealth + healAmount, unit.maxHealth);
        }
      });
      addToBattleLog(`💚 Healed for ${healAmount}!`);
    } else if (card.name === 'Meteor Storm') {
      const damage = card.attack;
      state.units.forEach(unit => {
        if (unit.team === 'opponent' && !unit.isDead) {
          unit.currentHealth -= damage;
          if (unit.currentHealth <= 0) {
            unit.isDead = true;
          }
        }
      });
      addToBattleLog(`☄️ Meteor Storm dealt ${damage} to all enemies!`);
    }

    checkGameOver(state);
  };

  const aiTurn = (currentState: BattleState) => {
    const newState = { ...currentState };
    newState.turn = 'opponent';

    // Simple AI: Play a random affordable card
    setTimeout(() => {
      const affordableCards = playerDeck.filter(pc => pc.card.cost <= newState.opponentElixir);

      if (affordableCards.length > 0) {
        const randomCard = affordableCards[Math.floor(Math.random() * affordableCards.length)];
        const card = randomCard.card;

        newState.opponentElixir -= card.cost;

        if (card.card_type === 'spell') {
          // AI spell effects (reversed)
          if (card.name === 'Lightning Bolt') {
            newState.playerHealth -= card.attack;
            addToBattleLog(`AI cast Lightning Bolt for ${card.attack}!`);
          } else if (card.name === 'Healing Wave') {
            newState.opponentHealth = Math.min(newState.opponentHealth + 50, 1000);
            addToBattleLog('AI healed their units!');
          }
        } else {
          const newUnit: BattleUnit = {
            id: `ai-unit-${Date.now()}-${Math.random()}`,
            cardId: card.id,
            card: card,
            level: randomCard.level,
            currentHealth: card.health * randomCard.level,
            maxHealth: card.health * randomCard.level,
            position: Math.floor(Math.random() * 3),
            team: 'opponent',
            isDead: false
          };
          newState.units.push(newUnit);
          addToBattleLog(`AI played ${card.emoji} ${card.name}!`);
        }
      }

      // Combat phase
      processCombat(newState);

      // Regenerate elixir
      newState.playerElixir = Math.min(newState.playerElixir + 2, 10);
      newState.opponentElixir = Math.min(newState.opponentElixir + 2, 10);
      newState.round += 1;
      newState.turn = 'player';

      checkGameOver(newState);
      setBattleState(newState);
    }, 1500);
  };

  const processCombat = (state: BattleState) => {
    const playerUnits = state.units.filter(u => u.team === 'player' && !u.isDead);
    const opponentUnits = state.units.filter(u => u.team === 'opponent' && !u.isDead);

    // Units attack
    playerUnits.forEach(unit => {
      if (opponentUnits.length > 0) {
        const target = opponentUnits[0];
        target.currentHealth -= unit.card.attack;
        addToBattleLog(`${unit.card.emoji} attacked for ${unit.card.attack}!`);

        if (target.currentHealth <= 0) {
          target.isDead = true;
          addToBattleLog(`Enemy ${target.card.emoji} defeated!`);
        }
      } else {
        // Attack opponent directly
        state.opponentHealth -= unit.card.attack;
        addToBattleLog(`${unit.card.emoji} hit opponent for ${unit.card.attack}!`);
      }
    });

    opponentUnits.forEach(unit => {
      if (!unit.isDead) {
        if (playerUnits.length > 0) {
          const target = playerUnits[0];
          if (!target.isDead) {
            target.currentHealth -= unit.card.attack;

            if (target.currentHealth <= 0) {
              target.isDead = true;
              addToBattleLog(`Your ${target.card.emoji} was defeated!`);
            }
          }
        } else {
          state.playerHealth -= unit.card.attack;
          addToBattleLog(`Enemy ${unit.card.emoji} hit you for ${unit.card.attack}!`);
        }
      }
    });
  };

  const checkGameOver = (state: BattleState) => {
    if (state.playerHealth <= 0) {
      state.isGameOver = true;
      state.winner = 'opponent';
      addToBattleLog('💔 Defeat! Better luck next time!');
      saveBattleResult('loss');
    } else if (state.opponentHealth <= 0) {
      state.isGameOver = true;
      state.winner = 'player';
      addToBattleLog('🎉 Victory! You won the battle!');
      saveBattleResult('win');
    }
  };

  const saveBattleResult = async (result: 'win' | 'loss') => {
    const trophyChange = result === 'win' ? 30 : -15;

    try {
      await supabase.from('battle_matches').insert({
        player_id: userId,
        opponent_type: 'ai',
        result: result,
        trophies_gained: result === 'win' ? 30 : 0,
        trophies_lost: result === 'loss' ? 15 : 0,
        duration_seconds: battleState.round * 5
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
            total_wins: stats.total_wins + (result === 'win' ? 1 : 0),
            total_losses: stats.total_losses + (result === 'loss' ? 1 : 0),
            win_streak: result === 'win' ? stats.win_streak + 1 : 0,
            best_win_streak: result === 'win' ? Math.max(stats.best_win_streak, stats.win_streak + 1) : stats.best_win_streak,
            highest_trophies: Math.max(stats.highest_trophies, stats.trophies + trophyChange),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } else {
        await supabase.from('player_battle_stats').insert({
          user_id: userId,
          trophies: Math.max(0, trophyChange),
          total_wins: result === 'win' ? 1 : 0,
          total_losses: result === 'loss' ? 1 : 0,
          win_streak: result === 'win' ? 1 : 0,
          best_win_streak: result === 'win' ? 1 : 0,
          highest_trophies: Math.max(0, trophyChange)
        });
      }
    } catch (error) {
      console.error('Error saving battle result:', error);
    }
  };

  const addToBattleLog = (message: string) => {
    setBattleLog(prev => [...prev.slice(-5), message]);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading battle arena...</div>
      </div>
    );
  }

  if (playerDeck.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={onBack} className="mb-4 px-4 py-2 bg-gray-200 rounded-lg flex items-center gap-2">
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-xl mb-4">You don't have any cards yet!</p>
          <p className="text-gray-600">Go to the Card Collection to unlock your starter cards.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto">
        <button onClick={onBack} className="mb-4 px-4 py-2 bg-white rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow">
          <ArrowLeft size={20} />
          Back to Games
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Player Stats */}
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">YOU</span>
              <div className="flex items-center gap-2">
                <Heart size={20} />
                <span className="text-xl font-bold">{battleState.playerHealth}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-yellow-300" />
              <div className="flex-1 bg-white/30 rounded-full h-3">
                <div
                  className="bg-yellow-300 h-full rounded-full transition-all"
                  style={{ width: `${(battleState.playerElixir / 10) * 100}%` }}
                />
              </div>
              <span className="font-bold">{battleState.playerElixir}</span>
            </div>
          </div>

          {/* Round Counter */}
          <div className="bg-white rounded-xl p-4 shadow-lg text-center flex flex-col justify-center">
            <div className="text-sm text-gray-600 mb-1">Round</div>
            <div className="text-3xl font-bold text-indigo-600">{battleState.round}</div>
            <div className="text-sm mt-2">
              {battleState.turn === 'player' ? (
                <span className="text-blue-600 font-bold">Your Turn</span>
              ) : (
                <span className="text-red-600 font-bold">AI Turn</span>
              )}
            </div>
          </div>

          {/* Opponent Stats */}
          <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Heart size={20} />
                <span className="text-xl font-bold">{battleState.opponentHealth}</span>
              </div>
              <span className="font-bold">AI OPPONENT</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{battleState.opponentElixir}</span>
              <div className="flex-1 bg-white/30 rounded-full h-3">
                <div
                  className="bg-yellow-300 h-full rounded-full transition-all"
                  style={{ width: `${(battleState.opponentElixir / 10) * 100}%` }}
                />
              </div>
              <Zap size={20} className="text-yellow-300" />
            </div>
          </div>
        </div>

        {/* Battle Arena */}
        <div className="bg-gradient-to-b from-green-600 to-green-800 rounded-xl p-6 mb-4 shadow-lg min-h-[400px] relative overflow-hidden">
          {/* Opponent Side */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-red-900/20 border-b-2 border-yellow-400">
            <div className="p-4">
              <div className="text-white font-bold mb-2 text-center">Enemy Territory</div>
              <div className="flex gap-2 justify-center flex-wrap">
                {battleState.units.filter(u => u.team === 'opponent' && !u.isDead).map(unit => (
                  <div key={unit.id} className="relative">
                    <div className="text-4xl animate-bounce">{unit.card.emoji}</div>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                      {unit.currentHealth}/{unit.maxHealth}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Player Side */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-blue-900/20">
            <div className="p-4">
              <div className="flex gap-2 justify-center flex-wrap">
                {battleState.units.filter(u => u.team === 'player' && !u.isDead).map(unit => (
                  <div key={unit.id} className="relative">
                    <div className="text-4xl">{unit.card.emoji}</div>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                      {unit.currentHealth}/{unit.maxHealth}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-white font-bold mt-2 text-center">Your Territory</div>
            </div>
          </div>

          {/* Game Over Overlay */}
          {battleState.isGameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
              <div className="bg-white rounded-xl p-8 text-center max-w-md">
                <div className="text-6xl mb-4">
                  {battleState.winner === 'player' ? '🎉' : '💔'}
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  {battleState.winner === 'player' ? 'Victory!' : 'Defeat!'}
                </h2>
                <p className="text-gray-600 mb-2">
                  {battleState.winner === 'player'
                    ? '+30 Trophies'
                    : '-15 Trophies'}
                </p>
                <p className="text-gray-600 mb-6">
                  Battle lasted {battleState.round} rounds
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-bold hover:scale-105 transition-transform"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Battle Log */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-lg">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <Swords size={20} />
            Battle Log
          </h3>
          <div className="space-y-1 h-24 overflow-y-auto">
            {battleLog.map((log, i) => (
              <div key={i} className="text-sm text-gray-700">{log}</div>
            ))}
          </div>
        </div>

        {/* Player Hand */}
        <div className="bg-white rounded-xl p-4 shadow-lg">
          <h3 className="font-bold mb-3">Your Cards</h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {playerDeck.map((playerCard) => {
              const card = playerCard.card;
              const canPlay = battleState.playerElixir >= card.cost && battleState.turn === 'player' && !battleState.isGameOver;

              return (
                <button
                  key={playerCard.id}
                  onClick={() => canPlay && playCard(playerCard, 1)}
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
                  <div className="text-xs mt-1">Lv.{playerCard.level}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
