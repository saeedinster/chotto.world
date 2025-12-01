import { useState, useEffect } from 'react';
import { Trophy, Flame, BookOpen, Heart, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AchievementBadge, ACHIEVEMENTS } from './AchievementBadge';

interface ProgressStats {
  totalStoriesRead: number;
  currentStreak: number;
  longestStreak: number;
  favoriteCount: number;
  achievements: string[];
  lastReadDate: string | null;
}

export function ProgressDashboard() {
  const [stats, setStats] = useState<ProgressStats>({
    totalStoriesRead: 0,
    currentStreak: 0,
    longestStreak: 0,
    favoriteCount: 0,
    achievements: [],
    lastReadDate: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [streakData, progressData, achievementData] = await Promise.all([
        supabase
          .from('reading_streaks')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('reading_progress')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('user_achievements')
          .select('achievement_type')
          .eq('user_id', user.id),
      ]);

      const totalRead = progressData.data?.filter(p => p.completed).length || 0;
      const favorites = progressData.data?.filter(p => p.favorited).length || 0;

      setStats({
        totalStoriesRead: totalRead,
        currentStreak: streakData.data?.current_streak || 0,
        longestStreak: streakData.data?.longest_streak || 0,
        favoriteCount: favorites,
        achievements: achievementData.data?.map(a => a.achievement_type) || [],
        lastReadDate: streakData.data?.last_read_date || null,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-xl text-gray-600 animate-pulse">Loading your progress...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all">
          <BookOpen className="w-10 h-10 mb-2 mx-auto" />
          <div className="text-3xl font-bold text-center">{stats.totalStoriesRead}</div>
          <div className="text-sm text-center opacity-90">Stories Read</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all">
          <Flame className="w-10 h-10 mb-2 mx-auto" />
          <div className="text-3xl font-bold text-center">{stats.currentStreak}</div>
          <div className="text-sm text-center opacity-90">Day Streak</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all">
          <TrendingUp className="w-10 h-10 mb-2 mx-auto" />
          <div className="text-3xl font-bold text-center">{stats.longestStreak}</div>
          <div className="text-sm text-center opacity-90">Best Streak</div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all">
          <Heart className="w-10 h-10 mb-2 mx-auto" />
          <div className="text-3xl font-bold text-center">{stats.favoriteCount}</div>
          <div className="text-sm text-center opacity-90">Favorites</div>
        </div>
      </div>

      {stats.currentStreak > 0 && (
        <div className="bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-300 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="w-8 h-8 text-orange-600" />
            <h3 className="text-2xl font-bold text-orange-800">You're on fire!</h3>
          </div>
          <p className="text-orange-700 text-lg">
            Keep reading daily to maintain your {stats.currentStreak} day streak!
          </p>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-8 h-8 text-yellow-600" />
          <h2 className="text-3xl font-bold text-gray-800">Your Achievements</h2>
        </div>

        {stats.achievements.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">Start reading to earn achievements!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stats.achievements.map((achievementType) => {
              const achievement = ACHIEVEMENTS[achievementType];
              return achievement ? (
                <AchievementBadge key={achievementType} achievement={achievement} />
              ) : null;
            })}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6">
        <h3 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Unlock More Achievements
        </h3>
        <div className="space-y-2">
          {Object.values(ACHIEVEMENTS)
            .filter(a => !stats.achievements.includes(a.type))
            .slice(0, 3)
            .map(achievement => (
              <div key={achievement.type} className="flex items-center gap-3 bg-white rounded-xl p-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-2xl">🔒</div>
                </div>
                <div>
                  <div className="font-bold text-gray-800">{achievement.title}</div>
                  <div className="text-sm text-gray-600">{achievement.description}</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
