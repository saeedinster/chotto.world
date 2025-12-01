import React, { useState, useEffect } from 'react';
import { Trophy, Star, Lock, ArrowLeft, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BattleCard, PlayerCard } from '../../types/battle';

interface CardCollectionProps {
  onBack: () => void;
  userId: string;
}

export function CardCollection({ onBack, userId }: CardCollectionProps) {
  const [allCards, setAllCards] = useState<BattleCard[]>([]);
  const [playerCards, setPlayerCards] = useState<PlayerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<BattleCard | null>(null);
  const [filter, setFilter] = useState<'all' | 'owned' | 'locked'>('all');

  useEffect(() => {
    loadCards();
  }, [userId]);

  const loadCards = async () => {
    try {
      const [cardsRes, playerCardsRes] = await Promise.all([
        supabase.from('battle_cards').select('*').order('rarity', { ascending: true }),
        supabase.from('player_cards').select('*').eq('user_id', userId)
      ]);

      if (cardsRes.data) setAllCards(cardsRes.data);
      if (playerCardsRes.data) setPlayerCards(playerCardsRes.data);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const unlockStarterCards = async () => {
    const starterCards = allCards.filter(c => c.unlock_arena === 0 && c.rarity === 'common');

    try {
      const newCards = starterCards.map(card => ({
        user_id: userId,
        card_id: card.id,
        level: 1,
        quantity: 1
      }));

      await supabase.from('player_cards').insert(newCards);

      const { data: stats } = await supabase
        .from('player_battle_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!stats) {
        await supabase.from('player_battle_stats').insert({
          user_id: userId,
          trophies: 0,
          arena_level: 0,
          total_cards_unlocked: newCards.length
        });
      } else {
        await supabase
          .from('player_battle_stats')
          .update({
            total_cards_unlocked: stats.total_cards_unlocked + newCards.length
          })
          .eq('user_id', userId);
      }

      loadCards();
    } catch (error) {
      console.error('Error unlocking cards:', error);
    }
  };

  const upgradeCard = async (playerCard: PlayerCard) => {
    if (playerCard.level >= 13) return;

    const requiredQuantity = playerCard.level * 10;
    if (playerCard.quantity < requiredQuantity) {
      alert(`Need ${requiredQuantity} cards to upgrade! You have ${playerCard.quantity}`);
      return;
    }

    try {
      await supabase
        .from('player_cards')
        .update({
          level: playerCard.level + 1,
          quantity: playerCard.quantity - requiredQuantity
        })
        .eq('id', playerCard.id);

      loadCards();
    } catch (error) {
      console.error('Error upgrading card:', error);
    }
  };

  const isCardOwned = (cardId: string) => {
    return playerCards.some(pc => pc.card_id === cardId);
  };

  const getPlayerCard = (cardId: string) => {
    return playerCards.find(pc => pc.card_id === cardId);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'epic': return 'bg-gradient-to-r from-purple-400 to-pink-500';
      case 'rare': return 'bg-gradient-to-r from-blue-400 to-cyan-500';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600';
    }
  };

  const filteredCards = allCards.filter(card => {
    if (filter === 'owned') return isCardOwned(card.id);
    if (filter === 'locked') return !isCardOwned(card.id);
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading card collection...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-4">
      <div className="max-w-6xl mx-auto">
        <button onClick={onBack} className="mb-4 px-4 py-2 bg-white rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow">
          <ArrowLeft size={20} />
          Back to Games
        </button>

        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Card Collection
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="text-yellow-500" size={20} />
              <span className="font-bold">{playerCards.length}/{allCards.length} Cards</span>
            </div>
          </div>

          {playerCards.length === 0 && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-6 text-white text-center mb-4">
              <h2 className="text-2xl font-bold mb-2">Welcome to Story Battle Arena!</h2>
              <p className="mb-4">Get your starter cards to begin your adventure!</p>
              <button
                onClick={unlockStarterCards}
                className="px-6 py-3 bg-white text-purple-600 rounded-lg font-bold hover:scale-105 transition-transform"
              >
                Unlock Starter Cards
              </button>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-200'
              }`}
            >
              All Cards
            </button>
            <button
              onClick={() => setFilter('owned')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                filter === 'owned' ? 'bg-purple-600 text-white' : 'bg-gray-200'
              }`}
            >
              Owned
            </button>
            <button
              onClick={() => setFilter('locked')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                filter === 'locked' ? 'bg-purple-600 text-white' : 'bg-gray-200'
              }`}
            >
              Locked
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredCards.map(card => {
            const owned = isCardOwned(card.id);
            const playerCard = getPlayerCard(card.id);

            return (
              <div
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`relative bg-gradient-to-br ${getRarityColor(card.rarity)} rounded-xl p-4 cursor-pointer transition-all hover:scale-105 shadow-lg ${
                  !owned ? 'opacity-60' : ''
                }`}
              >
                {!owned && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                    <Lock className="text-white" size={40} />
                  </div>
                )}

                <div className="text-center text-white">
                  <div className="text-5xl mb-2">{card.emoji}</div>
                  <div className="font-bold text-sm mb-1 truncate">{card.name}</div>
                  <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getRarityBadge(card.rarity)} mb-2`}>
                    {card.rarity.toUpperCase()}
                  </div>

                  {owned && playerCard && (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs font-bold">Level {playerCard.level}</div>
                      <div className="text-xs">x{playerCard.quantity}</div>
                    </div>
                  )}

                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                    <div className="bg-white/20 rounded px-1 py-0.5">
                      <div className="text-[10px] opacity-80">HP</div>
                      <div className="font-bold">{card.health}</div>
                    </div>
                    <div className="bg-white/20 rounded px-1 py-0.5">
                      <div className="text-[10px] opacity-80">ATK</div>
                      <div className="font-bold">{card.attack}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedCard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCard(null)}>
            <div className={`bg-gradient-to-br ${getRarityColor(selectedCard.rarity)} rounded-xl p-6 max-w-md w-full text-white`} onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-4">
                <div className="text-7xl mb-3">{selectedCard.emoji}</div>
                <h2 className="text-2xl font-bold mb-2">{selectedCard.name}</h2>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getRarityBadge(selectedCard.rarity)}`}>
                  {selectedCard.rarity.toUpperCase()}
                </div>
              </div>

              <div className="bg-white/20 rounded-lg p-4 mb-4">
                <p className="text-sm mb-3">{selectedCard.description}</p>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <div className="text-xs opacity-80 mb-1">Cost</div>
                    <div className="text-xl font-bold">{selectedCard.cost}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs opacity-80 mb-1">Health</div>
                    <div className="text-xl font-bold">{selectedCard.health}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs opacity-80 mb-1">Attack</div>
                    <div className="text-xl font-bold">{selectedCard.attack}</div>
                  </div>
                </div>

                {selectedCard.special_ability && (
                  <div className="bg-white/30 rounded p-2 text-sm">
                    <div className="font-bold mb-1">Special Ability:</div>
                    <div>{selectedCard.special_ability}</div>
                  </div>
                )}
              </div>

              {isCardOwned(selectedCard.id) && getPlayerCard(selectedCard.id) && (
                <div className="bg-white/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">Your Card:</span>
                    <span className="text-sm">Level {getPlayerCard(selectedCard.id)!.level}</span>
                  </div>
                  <div className="text-sm mb-3">
                    Copies: {getPlayerCard(selectedCard.id)!.quantity}
                  </div>

                  {getPlayerCard(selectedCard.id)!.level < 13 && (
                    <button
                      onClick={() => upgradeCard(getPlayerCard(selectedCard.id)!)}
                      className="w-full px-4 py-2 bg-white text-purple-600 rounded-lg font-bold hover:scale-105 transition-transform"
                    >
                      Upgrade ({getPlayerCard(selectedCard.id)!.level * 10} cards needed)
                    </button>
                  )}

                  {getPlayerCard(selectedCard.id)!.level >= 13 && (
                    <div className="text-center text-sm font-bold">
                      <Star className="inline" size={16} /> MAX LEVEL
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setSelectedCard(null)}
                className="w-full px-4 py-2 bg-white/30 rounded-lg font-bold hover:bg-white/40 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
