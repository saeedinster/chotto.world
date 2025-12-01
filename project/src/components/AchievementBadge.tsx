import { Trophy, Star, Flame, BookOpen, Heart, Zap } from 'lucide-react';

interface Achievement {
  type: string;
  title: string;
  description: string;
  icon: 'trophy' | 'star' | 'flame' | 'book' | 'heart' | 'zap';
  color: string;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  showAnimation?: boolean;
}

const iconMap = {
  trophy: Trophy,
  star: Star,
  flame: Flame,
  book: BookOpen,
  heart: Heart,
  zap: Zap,
};

export function AchievementBadge({ achievement, showAnimation = false }: AchievementBadgeProps) {
  const Icon = iconMap[achievement.icon];

  return (
    <div
      className={`relative ${
        showAnimation ? 'animate-bounce' : ''
      }`}
    >
      <div
        className={`bg-gradient-to-br ${achievement.color} p-6 rounded-2xl shadow-xl transform hover:scale-110 transition-all duration-300`}
      >
        <div className="text-center">
          <Icon className="w-12 h-12 text-white mx-auto mb-2" />
          <h3 className="text-white font-bold text-lg mb-1">{achievement.title}</h3>
          <p className="text-white text-sm opacity-90">{achievement.description}</p>
        </div>
      </div>
      {showAnimation && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            NEW!
          </div>
        </div>
      )}
    </div>
  );
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_story: {
    type: 'first_story',
    title: 'First Story!',
    description: 'Read your first story',
    icon: 'book',
    color: 'from-blue-500 to-cyan-600',
  },
  bookworm: {
    type: 'bookworm',
    title: 'Bookworm',
    description: 'Read 10 stories',
    icon: 'star',
    color: 'from-purple-500 to-pink-600',
  },
  story_master: {
    type: 'story_master',
    title: 'Story Master',
    description: 'Read 50 stories',
    icon: 'trophy',
    color: 'from-yellow-500 to-orange-600',
  },
  streak_starter: {
    type: 'streak_starter',
    title: 'Streak Starter',
    description: 'Read 3 days in a row',
    icon: 'flame',
    color: 'from-red-500 to-pink-600',
  },
  streak_champion: {
    type: 'streak_champion',
    title: 'Streak Champion',
    description: 'Read 7 days in a row',
    icon: 'flame',
    color: 'from-orange-500 to-red-600',
  },
  quiz_ace: {
    type: 'quiz_ace',
    title: 'Quiz Ace',
    description: 'Score 100% on a quiz',
    icon: 'zap',
    color: 'from-green-500 to-emerald-600',
  },
  favorite_collector: {
    type: 'favorite_collector',
    title: 'Favorite Collector',
    description: 'Mark 5 stories as favorites',
    icon: 'heart',
    color: 'from-pink-500 to-rose-600',
  },
};
