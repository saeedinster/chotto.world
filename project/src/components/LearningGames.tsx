import { useState, useEffect } from 'react';
import { Gamepad2, Star, Zap, ArrowLeft, Trophy, Clock, Swords } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MemoryGame } from './games/MemoryGame';
import { CountingGame } from './games/CountingGame';
import { ShapeMatchGame } from './games/ShapeMatchGame';
import { BattleGame } from './BattleGame';

interface Game {
  id: string;
  name: string;
  type: string;
  difficulty: string;
  age_range: string;
  description: string;
  config: any;
}

interface LearningGamesProps {
  onBack: () => void;
  onShowAuth: () => void;
}

export function LearningGames({ onBack, onShowAuth }: LearningGamesProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [highScores, setHighScores] = useState<Record<string, number>>({});
  const [showBattleGame, setShowBattleGame] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadGames();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const loadGames = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_games')
        .select('*')
        .order('difficulty', { ascending: true });

      if (error) throw error;
      setGames(data || []);
      await loadHighScores();
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHighScores = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('game_scores')
        .select('game_id, score')
        .eq('user_id', user.id)
        .order('score', { ascending: false });

      if (error) throw error;

      const scores: Record<string, number> = {};
      data?.forEach((score) => {
        if (!scores[score.game_id] || scores[score.game_id] < score.score) {
          scores[score.game_id] = score.score;
        }
      });
      setHighScores(scores);
    } catch (error) {
      console.error('Error loading high scores:', error);
    }
  };

  const handleGameComplete = async (score: number, timeTaken: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedGame) return;

      await supabase.from('game_scores').insert({
        user_id: user.id,
        game_id: selectedGame.id,
        score,
        time_taken_seconds: timeTaken,
        completed: true,
      });

      const xpEarned = Math.floor(score / 10);
      await supabase.rpc('add_experience_points', {
        p_user_id: user.id,
        p_xp: xpEarned,
      }).catch(() => {});

      await supabase.from('virtual_rewards').insert({
        user_id: user.id,
        reward_type: 'star',
        reward_name: `Completed ${selectedGame.name}`,
        reward_emoji: '⭐',
        source: 'game',
      });

      await loadHighScores();
      setSelectedGame(null);
    } catch (error) {
      console.error('Error saving game score:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'from-green-500 to-emerald-600';
      case 'medium':
        return 'from-yellow-500 to-orange-600';
      case 'hard':
        return 'from-red-500 to-pink-600';
      default:
        return 'from-blue-500 to-cyan-600';
    }
  };

  const getGameIcon = (type: string) => {
    switch (type) {
      case 'memory':
        return '🧠';
      case 'counting':
        return '🔢';
      case 'matching':
        return '🎯';
      case 'spelling':
        return '📝';
      case 'logic':
        return '🧩';
      case 'phonics':
        return '🎵';
      case 'creative':
        return '🎨';
      default:
        return '🎮';
    }
  };

  if (showBattleGame) {
    return <BattleGame userId={userId} onShowAuth={onShowAuth} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">Loading games...</div>
      </div>
    );
  }

  if (selectedGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 p-4">
        {selectedGame.type === 'memory' && (
          <MemoryGame
            game={selectedGame}
            onComplete={handleGameComplete}
            onBack={() => setSelectedGame(null)}
          />
        )}
        {selectedGame.type === 'counting' && (
          <CountingGame
            game={selectedGame}
            onComplete={handleGameComplete}
            onBack={() => setSelectedGame(null)}
          />
        )}
        {selectedGame.type === 'matching' && (
          <ShapeMatchGame
            game={selectedGame}
            onComplete={handleGameComplete}
            onBack={() => setSelectedGame(null)}
          />
        )}
        {!['memory', 'counting', 'matching'].includes(selectedGame.type) && (
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedGame(null)}
              className="mb-6 bg-white text-gray-800 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Games
            </button>
            <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
              <div className="text-8xl mb-4">{getGameIcon(selectedGame.type)}</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Coming Soon!</h2>
              <p className="text-xl text-gray-600">
                {selectedGame.name} is being prepared for you!
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 bg-white text-gray-800 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Gamepad2 className="w-16 h-16 text-purple-600 animate-bounce" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Learning Games
            </h1>
            <p className="text-xl text-gray-600">
              Play fun games and learn while having a blast!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              onClick={() => setShowBattleGame(true)}
              className="bg-gradient-to-br from-red-400 to-orange-500 rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all text-left relative overflow-hidden border-4 border-yellow-400"
            >
              <div className="absolute top-2 right-2">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                  NEW!
                </div>
              </div>

              <div className="text-6xl mb-3 text-center animate-bounce">⚔️</div>
              <h3 className="text-xl font-bold text-white mb-2">Story Battle Arena</h3>
              <p className="text-sm text-white/90 mb-3">
                Collect magical cards and battle with cute characters! Similar to Clash Royale but kid-friendly!
              </p>
              <p className="text-sm text-yellow-100 font-medium mb-2">
                Ages 4-8
              </p>

              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                <Swords className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">
                  Card Battle Game
                </span>
              </div>
            </button>

            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game)}
                className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all text-left relative overflow-hidden"
              >
                <div className="absolute top-2 right-2">
                  <div className={`bg-gradient-to-r ${getDifficultyColor(game.difficulty)} text-white px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                    {game.difficulty}
                  </div>
                </div>

                <div className="text-6xl mb-3 text-center">{getGameIcon(game.type)}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{game.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{game.description}</p>
                <p className="text-sm text-purple-600 font-medium mb-2">
                  Ages {game.age_range}
                </p>

                {highScores[game.id] && (
                  <div className="flex items-center gap-2 bg-yellow-100 rounded-lg px-3 py-2">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-bold text-yellow-800">
                      High Score: {highScores[game.id]}
                    </span>
                  </div>
                )}

                {!highScores[game.id] && (
                  <div className="flex items-center gap-2 bg-blue-100 rounded-lg px-3 py-2">
                    <Star className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-blue-800">
                      Not played yet
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
