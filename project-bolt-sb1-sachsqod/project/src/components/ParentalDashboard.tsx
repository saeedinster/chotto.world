import { useState, useEffect } from 'react';
import { BarChart3, Clock, BookOpen, TrendingUp, Star, Calendar, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ReadingData {
  totalStories: number;
  favoriteThemes: { theme: string; count: number }[];
  readingByAge: { age_range: string; count: number }[];
  recentActivity: { date: string; storiesRead: number }[];
  averageQuizScore: number;
  achievements: number;
  currentStreak: number;
  totalReadingTime: number;
}

export function ParentalDashboard() {
  const [data, setData] = useState<ReadingData>({
    totalStories: 0,
    favoriteThemes: [],
    readingByAge: [],
    recentActivity: [],
    averageQuizScore: 0,
    achievements: 0,
    currentStreak: 0,
    totalReadingTime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [progressData, quizData, achievementData, streakData] = await Promise.all([
        supabase
          .from('reading_progress')
          .select('*, premade_stories(theme, age_range, reading_time_minutes)')
          .eq('user_id', user.id)
          .eq('completed', true),
        supabase
          .from('quiz_results')
          .select('score')
          .eq('user_id', user.id),
        supabase
          .from('user_achievements')
          .select('achievement_type')
          .eq('user_id', user.id),
        supabase
          .from('reading_streaks')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      const stories = progressData.data || [];
      const totalStories = stories.length;

      const themeCount: Record<string, number> = {};
      const ageCount: Record<string, number> = {};
      let totalTime = 0;

      stories.forEach(story => {
        if (story.premade_stories) {
          const theme = story.premade_stories.theme;
          const age = story.premade_stories.age_range;
          const time = story.premade_stories.reading_time_minutes;

          themeCount[theme] = (themeCount[theme] || 0) + 1;
          ageCount[age] = (ageCount[age] || 0) + 1;
          totalTime += time * (story.read_count || 1);
        }
      });

      const favoriteThemes = Object.entries(themeCount)
        .map(([theme, count]) => ({ theme, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const readingByAge = Object.entries(ageCount)
        .map(([age_range, count]) => ({ age_range, count }))
        .sort((a, b) => a.age_range.localeCompare(b.age_range));

      const scores = quizData.data || [];
      const averageQuizScore = scores.length > 0
        ? Math.round(scores.reduce((sum, q) => sum + q.score, 0) / scores.length)
        : 0;

      const recentActivity: { date: string; storiesRead: number }[] = [];
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      last7Days.forEach(date => {
        const count = stories.filter(s =>
          s.last_read_at && s.last_read_at.split('T')[0] === date
        ).length;
        recentActivity.push({ date, storiesRead: count });
      });

      setData({
        totalStories,
        favoriteThemes,
        readingByAge,
        recentActivity,
        averageQuizScore,
        achievements: achievementData.data?.length || 0,
        currentStreak: streakData.data?.current_streak || 0,
        totalReadingTime: totalTime,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-xl text-gray-600 animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-purple-600" />
          Parental Dashboard
        </h2>
        <p className="text-gray-600 text-lg">
          Track your child's reading progress, achievements, and learning journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-6 rounded-2xl shadow-lg">
          <BookOpen className="w-10 h-10 mb-3" />
          <div className="text-4xl font-bold mb-2">{data.totalStories}</div>
          <div className="text-lg opacity-90">Stories Completed</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg">
          <Star className="w-10 h-10 mb-3" />
          <div className="text-4xl font-bold mb-2">{data.averageQuizScore}%</div>
          <div className="text-lg opacity-90">Average Quiz Score</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-2xl shadow-lg">
          <TrendingUp className="w-10 h-10 mb-3" />
          <div className="text-4xl font-bold mb-2">{data.currentStreak}</div>
          <div className="text-lg opacity-90">Day Reading Streak</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6 rounded-2xl shadow-lg">
          <Clock className="w-10 h-10 mb-3" />
          <div className="text-4xl font-bold mb-2">{data.totalReadingTime}</div>
          <div className="text-lg opacity-90">Minutes of Reading</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-600" />
            Favorite Themes
          </h3>
          <div className="space-y-3">
            {data.favoriteThemes.length === 0 ? (
              <p className="text-gray-500">No reading data yet</p>
            ) : (
              data.favoriteThemes.map(({ theme, count }) => (
                <div key={theme} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-gray-700 capitalize">{theme}</span>
                      <span className="text-gray-600">{count} stories</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full"
                        style={{ width: `${(count / data.totalStories) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Reading by Age Level
          </h3>
          <div className="space-y-3">
            {data.readingByAge.length === 0 ? (
              <p className="text-gray-500">No reading data yet</p>
            ) : (
              data.readingByAge.map(({ age_range, count }) => (
                <div key={age_range} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-gray-700">Ages {age_range}</span>
                      <span className="text-gray-600">{count} stories</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full"
                        style={{ width: `${(count / data.totalStories) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-600" />
          Reading Activity (Last 7 Days)
        </h3>
        <div className="flex items-end justify-between gap-2 h-48">
          {data.recentActivity.map(({ date, storiesRead }) => {
            const maxStories = Math.max(...data.recentActivity.map(a => a.storiesRead), 1);
            const height = (storiesRead / maxStories) * 100;
            const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-sm font-bold text-gray-700">{storiesRead}</div>
                <div
                  className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-lg transition-all"
                  style={{ height: `${height}%`, minHeight: storiesRead > 0 ? '20px' : '0' }}
                />
                <div className="text-xs text-gray-600 font-medium">{dayName}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 border-2 border-purple-300">
        <h3 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
          <Award className="w-6 h-6" />
          Recommendations
        </h3>
        <ul className="space-y-3">
          {data.currentStreak === 0 && (
            <li className="flex items-start gap-3">
              <div className="text-2xl">🎯</div>
              <div>
                <div className="font-bold text-purple-800">Start a Reading Streak</div>
                <div className="text-purple-700">Encourage daily reading to build consistency and earn achievements!</div>
              </div>
            </li>
          )}
          {data.averageQuizScore < 70 && data.totalStories > 3 && (
            <li className="flex items-start gap-3">
              <div className="text-2xl">📚</div>
              <div>
                <div className="font-bold text-purple-800">Reading Comprehension</div>
                <div className="text-purple-700">Try re-reading stories together and discussing the lessons to improve understanding.</div>
              </div>
            </li>
          )}
          {data.favoriteThemes.length > 0 && (
            <li className="flex items-start gap-3">
              <div className="text-2xl">⭐</div>
              <div>
                <div className="font-bold text-purple-800">Explore Similar Stories</div>
                <div className="text-purple-700">Your child loves {data.favoriteThemes[0].theme} stories! Try more in this category.</div>
              </div>
            </li>
          )}
          {data.totalStories >= 10 && (
            <li className="flex items-start gap-3">
              <div className="text-2xl">🎉</div>
              <div>
                <div className="font-bold text-purple-800">Great Progress!</div>
                <div className="text-purple-700">Your child has read {data.totalStories} stories. Keep up the excellent reading habit!</div>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
