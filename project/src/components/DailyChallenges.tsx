import { useState, useEffect } from 'react';
import { Calendar, Trophy, Zap, CheckCircle, Circle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Challenge {
  id: string;
  challenge_type: string;
  challenge_description: string;
  target_value: number;
  reward_xp: number;
  active_date: string;
}

interface ChallengeProgress {
  challenge_id: string;
  current_progress: number;
  completed: boolean;
}

export function DailyChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<Record<string, ChallengeProgress>>({});
  const [loading, setLoading] = useState(true);
  const [totalXP, setTotalXP] = useState(0);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      const { data: challengeData, error: challengeError } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('active_date', today);

      if (challengeError) throw challengeError;

      const { data: progressData, error: progressError } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      const progressMap: Record<string, ChallengeProgress> = {};
      progressData?.forEach((p) => {
        progressMap[p.challenge_id] = {
          challenge_id: p.challenge_id,
          current_progress: p.current_progress,
          completed: p.completed,
        };
      });

      const completedXP = (challengeData || [])
        .filter((c) => progressMap[c.id]?.completed)
        .reduce((sum, c) => sum + c.reward_xp, 0);

      setChallenges(challengeData || []);
      setProgress(progressMap);
      setTotalXP(completedXP);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'read_story':
        return '📚';
      case 'play_game':
        return '🎮';
      case 'quiz':
        return '🎯';
      case 'streak':
        return '🔥';
      default:
        return '⭐';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-xl text-gray-600 animate-pulse">Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-8 h-8 text-orange-600" />
              <h2 className="text-3xl font-bold text-orange-800">Today's Challenges</h2>
            </div>
            <p className="text-orange-700 text-lg">
              Complete challenges to earn XP and level up!
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-orange-600">{totalXP}</div>
            <div className="text-orange-700 font-medium">XP Earned Today</div>
          </div>
        </div>
      </div>

      {challenges.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-xl text-gray-600">No challenges available today. Check back tomorrow!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map((challenge) => {
            const prog = progress[challenge.id];
            const currentProgress = prog?.current_progress || 0;
            const isCompleted = prog?.completed || false;
            const percentage = Math.min((currentProgress / challenge.target_value) * 100, 100);

            return (
              <div
                key={challenge.id}
                className={`rounded-2xl shadow-lg p-6 ${
                  isCompleted
                    ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-400'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-5xl">{getChallengeIcon(challenge.challenge_type)}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {challenge.challenge_description}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Zap className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-bold text-yellow-700">
                          +{challenge.reward_xp} XP
                        </span>
                      </div>
                    </div>
                  </div>
                  {isCompleted ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <Circle className="w-8 h-8 text-gray-300" />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium text-gray-600">
                    <span>Progress</span>
                    <span>
                      {currentProgress}/{challenge.target_value}
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {isCompleted && (
                  <div className="mt-4 text-center">
                    <p className="text-green-800 font-bold text-lg">🎉 Challenge Complete!</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 border-2 border-purple-300">
        <div className="flex items-center gap-3 mb-3">
          <Trophy className="w-6 h-6 text-purple-600" />
          <h3 className="text-2xl font-bold text-purple-800">Tips</h3>
        </div>
        <ul className="space-y-2 text-purple-700">
          <li>✨ Complete all daily challenges to maximize your XP!</li>
          <li>🔥 Build a reading streak to unlock special achievements!</li>
          <li>🎮 Play different games to earn more rewards!</li>
          <li>📚 Read stories in your age range for the best learning experience!</li>
        </ul>
      </div>
    </div>
  );
}
