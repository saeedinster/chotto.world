import { useState, useEffect, useRef } from 'react';
import { BookOpen, Play, Pause, Square, ArrowLeft, Volume2, Heart, Trophy, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { StoryQuiz, generateQuizQuestions } from './StoryQuiz';
import { ProgressDashboard } from './ProgressDashboard';
import { ParentalDashboard } from './ParentalDashboard';

interface PremadeStory {
  id: string;
  title: string;
  age_range: string;
  theme: string;
  content: string;
  reading_time_minutes: number;
  author: string;
  cover_emoji: string;
  moral_lesson: string;
}

interface StoryLibraryReaderProps {
  onBack: () => void;
}

export function StoryLibraryReader({ onBack }: StoryLibraryReaderProps) {
  const [stories, setStories] = useState<PremadeStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<PremadeStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showParental, setShowParental] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    loadStories();
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedStory) {
      checkIfFavorited();
    }
  }, [selectedStory]);

  useEffect(() => {
    return () => {
      if (speechRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setShowProgress(false);
    }
  };

  const loadStories = async () => {
    try {
      const { data, error } = await supabase
        .from('premade_stories')
        .select('*')
        .order('age_range', { ascending: true });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorited = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedStory) return;

      const { data } = await supabase
        .from('reading_progress')
        .select('favorited')
        .eq('user_id', user.id)
        .eq('story_id', selectedStory.id)
        .maybeSingle();

      setIsFavorited(data?.favorited || false);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedStory) return;

      const newFavoriteStatus = !isFavorited;

      await supabase.from('reading_progress').upsert({
        user_id: user.id,
        story_id: selectedStory.id,
        favorited: newFavoriteStatus,
        last_read_at: new Date().toISOString(),
      }, { onConflict: 'user_id,story_id' });

      setIsFavorited(newFavoriteStatus);

      const { data: favCount } = await supabase
        .from('reading_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('favorited', true);

      if (favCount && favCount.length >= 5) {
        await supabase.from('user_achievements').upsert({
          user_id: user.id,
          achievement_type: 'favorite_collector',
        }, { onConflict: 'user_id,achievement_type' });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const markStoryComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedStory) return;

      await supabase.from('reading_progress').upsert({
        user_id: user.id,
        story_id: selectedStory.id,
        completed: true,
        last_read_at: new Date().toISOString(),
      }, { onConflict: 'user_id,story_id' });

      await updateStreak();
      await checkAchievements();
    } catch (error) {
      console.error('Error marking story complete:', error);
    }
  };

  const updateStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data: streakData } = await supabase
        .from('reading_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      let currentStreak = 1;
      let longestStreak = 1;
      let totalStories = 1;

      if (streakData) {
        totalStories = streakData.total_stories_read + 1;
        const lastDate = new Date(streakData.last_read_date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          currentStreak = streakData.current_streak;
        } else if (diffDays === 1) {
          currentStreak = streakData.current_streak + 1;
        } else {
          currentStreak = 1;
        }

        longestStreak = Math.max(currentStreak, streakData.longest_streak);
      }

      await supabase.from('reading_streaks').upsert({
        user_id: user.id,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_read_date: today,
        total_stories_read: totalStories,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (currentStreak >= 3) {
        await supabase.from('user_achievements').upsert({
          user_id: user.id,
          achievement_type: 'streak_starter',
        }, { onConflict: 'user_id,achievement_type' });
      }

      if (currentStreak >= 7) {
        await supabase.from('user_achievements').upsert({
          user_id: user.id,
          achievement_type: 'streak_champion',
        }, { onConflict: 'user_id,achievement_type' });
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const checkAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: completedStories } = await supabase
        .from('reading_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('completed', true);

      const count = completedStories?.length || 0;

      if (count >= 1) {
        await supabase.from('user_achievements').upsert({
          user_id: user.id,
          achievement_type: 'first_story',
        }, { onConflict: 'user_id,achievement_type' });
      }

      if (count >= 10) {
        await supabase.from('user_achievements').upsert({
          user_id: user.id,
          achievement_type: 'bookworm',
        }, { onConflict: 'user_id,achievement_type' });
      }

      if (count >= 50) {
        await supabase.from('user_achievements').upsert({
          user_id: user.id,
          achievement_type: 'story_master',
        }, { onConflict: 'user_id,achievement_type' });
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const filteredStories = stories.filter((story) => {
    const ageMatch = selectedAge === 'all' || story.age_range === selectedAge;
    const themeMatch = selectedTheme === 'all' || story.theme === selectedTheme;
    return ageMatch && themeMatch;
  });

  const uniqueAgeRanges = ['all', ...Array.from(new Set(stories.map((s) => s.age_range)))];
  const uniqueThemes = ['all', ...Array.from(new Set(stories.map((s) => s.theme)))];

  const readStory = () => {
    if (!selectedStory || !window.speechSynthesis) {
      alert('Text-to-speech is not supported in your browser!');
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();
    setIsReading(true);
    setIsPaused(false);

    const utterance = new SpeechSynthesisUtterance(
      `${selectedStory.title}. ${selectedStory.content}`
    );
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsReading(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsReading(false);
      setIsPaused(false);
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pauseReading = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const stopReading = () => {
    window.speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading story library...</div>
      </div>
    );
  }

  if (selectedStory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-800 via-amber-600 to-amber-800 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => {
              stopReading();
              setSelectedStory(null);
            }}
            className="mb-6 bg-white text-gray-800 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Library
          </button>

          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10">
            <div className="text-center mb-8">
              <div className="text-8xl mb-4">{selectedStory.cover_emoji}</div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
                {selectedStory.title}
              </h1>
              <p className="text-xl text-gray-600">
                Ages {selectedStory.age_range} • {selectedStory.reading_time_minutes} min read
              </p>
              <p className="text-lg text-purple-600 font-medium mt-2">
                Lesson: {selectedStory.moral_lesson}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 md:p-8 mb-6">
              <p className="text-xl md:text-2xl text-gray-800 leading-relaxed whitespace-pre-wrap">
                {selectedStory.content}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 justify-center mb-6">
              <button
                onClick={toggleFavorite}
                className={`${isFavorited ? 'bg-gradient-to-r from-pink-500 to-rose-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'} text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-3`}
              >
                <Heart className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? 'Favorited!' : 'Add to Favorites'}
              </button>

              {!isReading && !isPaused && (
                <button
                  onClick={readStory}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-3"
                >
                  <Volume2 className="w-6 h-6" />
                  Read Story Aloud
                </button>
              )}

              {isReading && !isPaused && (
                <button
                  onClick={pauseReading}
                  className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-3"
                >
                  <Pause className="w-6 h-6" />
                  Pause
                </button>
              )}

              {isPaused && (
                <button
                  onClick={readStory}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-3"
                >
                  <Play className="w-6 h-6" />
                  Resume
                </button>
              )}

              {(isReading || isPaused) && (
                <button
                  onClick={stopReading}
                  className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-3"
                >
                  <Square className="w-6 h-6" />
                  Stop
                </button>
              )}
            </div>

            {(isReading || isPaused) && (
              <div className="mt-6 text-center">
                <p className="text-lg text-purple-600 font-medium animate-pulse">
                  {isPaused ? 'Story paused...' : 'Reading story aloud...'}
                </p>
              </div>
            )}

            {!showQuiz && !quizCompleted && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    markStoryComplete();
                    setShowQuiz(true);
                  }}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-8 py-5 rounded-2xl text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                  <Trophy className="w-8 h-8" />
                  Take Quiz & Earn Points!
                </button>
              </div>
            )}

            {showQuiz && !quizCompleted && (
              <div className="mt-8">
                <StoryQuiz
                  storyId={selectedStory.id}
                  storyTitle={selectedStory.title}
                  questions={generateQuizQuestions(selectedStory.title, selectedStory.age_range, selectedStory.theme)}
                  onComplete={(score) => {
                    setQuizCompleted(true);
                    setShowQuiz(false);
                  }}
                />
              </div>
            )}

            {quizCompleted && (
              <div className="mt-6 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 rounded-2xl p-6 text-center">
                <p className="text-2xl font-bold text-green-800">Quiz completed! Great job!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showProgress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setShowProgress(false)}
            className="mb-6 bg-white text-gray-800 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Library
          </button>
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10">
            <ProgressDashboard />
          </div>
        </div>
      </div>
    );
  }

  if (showParental) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setShowParental(false)}
            className="mb-6 bg-white text-gray-800 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Library
          </button>
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10">
            <ParentalDashboard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={onBack}
            className="bg-white text-gray-800 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <button
            onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                setShowProgress(true);
              } else {
                alert('Please sign in to view your progress!');
              }
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            My Progress
          </button>
          <button
            onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                setShowParental(true);
              } else {
                alert('Please sign in to view parental dashboard!');
              }
            }}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            Parent Dashboard
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <BookOpen className="w-16 h-16 text-purple-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Story Library
            </h1>
            <p className="text-xl text-gray-600">
              50 wonderful stories for kids ages 1-6!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Age Range
              </label>
              <select
                value={selectedAge}
                onChange={(e) => setSelectedAge(e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl font-bold text-lg focus:border-purple-500 focus:outline-none transition-colors"
              >
                {uniqueAgeRanges.map((age) => (
                  <option key={age} value={age}>
                    {age === 'all' ? 'All Ages' : `Ages ${age}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Theme
              </label>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl font-bold text-lg focus:border-purple-500 focus:outline-none transition-colors"
              >
                {uniqueThemes.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme === 'all' ? 'All Themes' : theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-center text-gray-600 mb-6 text-lg font-medium">
            Found {filteredStories.length} stories
          </p>

          {filteredStories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">No stories match your filters.</p>
              <p className="text-gray-500">Try selecting different options!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all text-left"
                >
                  <div className="text-5xl mb-3 text-center">{story.cover_emoji}</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{story.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Ages {story.age_range} • {story.theme}
                  </p>
                  <p className="text-sm text-purple-600 font-medium">
                    {story.reading_time_minutes} min read
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
