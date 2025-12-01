import React, { useState, useEffect } from 'react';
import { Swords, BookOpen, Trophy, Users, Crown, Zap } from 'lucide-react';
import { BattleArena } from './battle/BattleArena';
import { CardCollection } from './battle/CardCollection';
import { BattleStats } from './battle/BattleStats';
import { Matchmaking } from './battle/Matchmaking';
import { MultiplayerBattle } from './battle/MultiplayerBattle';
import { FriendsSystem } from './battle/FriendsSystem';
import { Leaderboard } from './battle/Leaderboard';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface BattleGameProps {
  userId: string | null;
  onShowAuth: () => void;
}

type ViewType = 'menu' | 'battle' | 'collection' | 'stats' | 'matchmaking' | 'multiplayer' | 'friends' | 'leaderboard';

export function BattleGame({ userId, onShowAuth }: BattleGameProps) {
  const { t } = useLanguage();
  const [view, setView] = useState<ViewType>('menu');
  const [matchId, setMatchId] = useState<string | null>(null);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [trophies, setTrophies] = useState(0);

  useEffect(() => {
    if (userId) {
      loadTrophies();
    }
  }, [userId]);

  const loadTrophies = async () => {
    if (!userId) return;

    try {
      const { data } = await supabase
        .from('player_battle_stats')
        .select('trophies')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setTrophies(data.trophies);
      }
    } catch (error) {
      console.error('Error loading trophies:', error);
    }
  };

  const handleMatchFound = (foundMatchId: string, foundOpponentId: string) => {
    setMatchId(foundMatchId);
    setOpponentId(foundOpponentId);
    setView('multiplayer');
  };

  const handleChallengeFriend = async (friendId: string) => {
    if (!userId) return;

    try {
      const { data: match, error } = await supabase
        .from('battle_live_matches')
        .insert({
          player1_id: userId,
          player2_id: friendId,
          current_turn: userId,
          game_state: { units: [], log: ['Battle started!'] }
        })
        .select()
        .single();

      if (error) throw error;

      setMatchId(match.id);
      setOpponentId(friendId);
      setView('multiplayer');
    } catch (error) {
      console.error('Error creating friend battle:', error);
      alert('Error starting battle with friend');
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-xl">
          <div className="text-6xl mb-4">⚔️</div>
          <h2 className="text-3xl font-bold mb-4">{t('battle.title')}</h2>
          <p className="text-gray-600 mb-6">
            {t('battle.subtitle')}
          </p>
          <button
            onClick={onShowAuth}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-bold hover:scale-105 transition-transform"
          >
            {t('battle.signInToPlay')}
          </button>
        </div>
      </div>
    );
  }

  if (view === 'battle') {
    return <BattleArena onBack={() => setView('menu')} userId={userId} />;
  }

  if (view === 'collection') {
    return <CardCollection onBack={() => setView('menu')} userId={userId} />;
  }

  if (view === 'stats') {
    return <BattleStats onBack={() => setView('menu')} userId={userId} />;
  }

  if (view === 'matchmaking') {
    return (
      <Matchmaking
        userId={userId}
        trophies={trophies}
        onMatchFound={handleMatchFound}
        onBack={() => setView('menu')}
      />
    );
  }

  if (view === 'multiplayer' && matchId && opponentId) {
    return (
      <MultiplayerBattle
        matchId={matchId}
        userId={userId}
        opponentId={opponentId}
        onBack={() => {
          setView('menu');
          setMatchId(null);
          setOpponentId(null);
          loadTrophies();
        }}
      />
    );
  }

  if (view === 'friends') {
    return (
      <FriendsSystem
        userId={userId}
        onChallengeFriend={handleChallengeFriend}
        onBack={() => setView('menu')}
      />
    );
  }

  if (view === 'leaderboard') {
    return <Leaderboard onBack={() => setView('menu')} userId={userId} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl p-8 mb-6 text-center shadow-xl">
          <div className="text-7xl mb-4 animate-bounce">⚔️</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            {t('battle.title')}
          </h1>
          <p className="text-gray-600 text-lg">
            {t('battle.subtitle')}
          </p>
        </div>

        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-4 mb-6 text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy size={32} />
            <div>
              <div className="text-sm opacity-90">{t('battle.yourTrophies')}</div>
              <div className="text-2xl font-bold">{trophies}</div>
            </div>
          </div>
          <Zap size={32} className="animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setView('matchmaking')}
            className="bg-gradient-to-br from-red-400 to-orange-500 rounded-xl p-6 text-white shadow-lg hover:scale-105 transition-transform border-4 border-yellow-400"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Swords size={40} />
              <span className="px-2 py-1 bg-yellow-400 text-red-800 rounded-full text-xs font-bold">{t('battle.newBadge')}</span>
            </div>
            <h3 className="text-xl font-bold mb-1">{t('battle.onlineBattle')}</h3>
            <p className="text-sm opacity-90">
              {t('battle.onlineBattleDesc')}
            </p>
          </button>

          <button
            onClick={() => setView('friends')}
            className="bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl p-6 text-white shadow-lg hover:scale-105 transition-transform"
          >
            <Users size={40} className="mx-auto mb-2" />
            <h3 className="text-xl font-bold mb-1">{t('battle.friends')}</h3>
            <p className="text-sm opacity-90">
              {t('battle.friendsDesc')}
            </p>
          </button>

          <button
            onClick={() => setView('leaderboard')}
            className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 text-white shadow-lg hover:scale-105 transition-transform"
          >
            <Crown size={40} className="mx-auto mb-2" />
            <h3 className="text-xl font-bold mb-1">{t('battle.leaderboard')}</h3>
            <p className="text-sm opacity-90">
              {t('battle.leaderboardDesc')}
            </p>
          </button>

          <button
            onClick={() => setView('battle')}
            className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl p-6 text-white shadow-lg hover:scale-105 transition-transform"
          >
            <Swords size={40} className="mx-auto mb-2" />
            <h3 className="text-xl font-bold mb-1">{t('battle.vsAI')}</h3>
            <p className="text-sm opacity-90">
              {t('battle.vsAIDesc')}
            </p>
          </button>

          <button
            onClick={() => setView('collection')}
            className="bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl p-6 text-white shadow-lg hover:scale-105 transition-transform"
          >
            <BookOpen size={40} className="mx-auto mb-2" />
            <h3 className="text-xl font-bold mb-1">{t('battle.cards')}</h3>
            <p className="text-sm opacity-90">
              {t('battle.cardsDesc')}
            </p>
          </button>

          <button
            onClick={() => setView('stats')}
            className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-6 text-white shadow-lg hover:scale-105 transition-transform"
          >
            <Trophy size={40} className="mx-auto mb-2" />
            <h3 className="text-xl font-bold mb-1">{t('battle.stats')}</h3>
            <p className="text-sm opacity-90">
              {t('battle.statsDesc')}
            </p>
          </button>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 mt-6 text-white shadow-lg">
          <h3 className="text-2xl font-bold mb-3">How to Play</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">1️⃣</span>
              <p><strong>Collect Cards:</strong> Unlock starter cards and build your collection!</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">2️⃣</span>
              <p><strong>Battle:</strong> Use elixir to play cards and defeat the opponent!</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">3️⃣</span>
              <p><strong>Win Trophies:</strong> Earn trophies to unlock new arenas and cards!</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">4️⃣</span>
              <p><strong>Upgrade:</strong> Level up your cards to make them stronger!</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 mt-6 shadow-lg">
          <h3 className="text-xl font-bold mb-3">Card Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-2 border-blue-300 rounded-lg p-4">
              <div className="text-3xl mb-2">🐲</div>
              <div className="font-bold text-blue-600 mb-1">Characters</div>
              <p className="text-sm text-gray-600">Fight for you on the battlefield!</p>
            </div>
            <div className="border-2 border-purple-300 rounded-lg p-4">
              <div className="text-3xl mb-2">⚡</div>
              <div className="font-bold text-purple-600 mb-1">Spells</div>
              <p className="text-sm text-gray-600">Instant magical effects!</p>
            </div>
            <div className="border-2 border-orange-300 rounded-lg p-4">
              <div className="text-3xl mb-2">🗼</div>
              <div className="font-bold text-orange-600 mb-1">Buildings</div>
              <p className="text-sm text-gray-600">Defend your territory!</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 mt-6 text-white shadow-lg text-center">
          <h3 className="text-2xl font-bold mb-2">Rarity Levels</h3>
          <div className="flex items-center justify-center gap-4 flex-wrap text-sm">
            <span className="font-bold">Common</span>
            <span className="font-bold">Rare</span>
            <span className="font-bold">Epic</span>
            <span className="font-bold text-xl">Legendary ⭐</span>
          </div>
        </div>
      </div>
    </div>
  );
}
