import { useState, useEffect } from 'react';
import { BookOpen, LogOut, Plus, Trash2, Eye, Library, Gamepad2, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { StoryData } from '../types/story';

interface UserLibraryProps {
  onCreateNew: () => void;
  onLogout: () => void;
  onReadLibrary: () => void;
  onGames: () => void;
  onChallenges: () => void;
  userProfile: {
    display_name: string;
    story_count: number;
    total_recording_time: number;
    subscription_status: string;
  };
}

interface SavedStory {
  id: string;
  title: string;
  theme: string;
  author_name: string;
  created_at: string;
}

export function UserLibrary({ onCreateNew, onLogout, onReadLibrary, onGames, onChallenges, userProfile }: UserLibraryProps) {
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<StoryData | null>(null);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('stories')
        .select('id, title, theme, author_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewStory = async (storyId: string) => {
    try {
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (storyError) throw storyError;

      const { data: characters } = await supabase
        .from('story_characters')
        .select('*')
        .eq('story_id', storyId)
        .order('position');

      const { data: pages } = await supabase
        .from('story_pages')
        .select('*')
        .eq('story_id', storyId)
        .order('page_number');

      const storyData: StoryData = {
        transcript: story.raw_transcript || '',
        enhancedStory: story.enhanced_story || '',
        title: story.title,
        theme: story.theme,
        authorName: story.author_name,
        authorImage: story.author_image_url || '',
        colorScheme: story.color_scheme || { primary: '#EC4899', secondary: '#8B5CF6' },
        characters: (characters || []).map((char: any) => ({
          name: char.name,
          description: char.description,
          emoji: char.appearance.emoji,
          color: char.appearance.color,
          role: char.role,
        })),
        pages: (pages || []).map((page: any) => ({
          pageNumber: page.page_number,
          content: page.content,
          sceneDescription: page.scene_description,
          animationStyle: page.animation_style,
          backgroundColor: page.background_color,
        })),
      };

      setSelectedStory(storyData);
    } catch (error) {
      console.error('Error viewing story:', error);
      alert('Could not load story. Please try again!');
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;
      setStories(stories.filter((s) => s.id !== storyId));
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Could not delete story. Please try again!');
    }
  };

  const canCreateStory = () => {
    if (userProfile.subscription_status === 'active') return true;
    return userProfile.story_count < 15 && userProfile.total_recording_time < 300;
  };

  const needsSubscription = () => {
    return userProfile.story_count >= 15 || userProfile.total_recording_time >= 300;
  };

  if (selectedStory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-800 via-amber-600 to-amber-800 p-8">
        <button
          onClick={() => setSelectedStory(null)}
          className="mb-6 bg-white text-gray-800 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          ← Back to Library
        </button>
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow-2xl">
          <h1 className="text-4xl font-bold text-gray-800 mb-6">{selectedStory.title}</h1>
          <div className="space-y-6">
            {selectedStory.pages.map((page, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6"
              >
                <p className="text-xl text-gray-800 leading-relaxed">{page.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Welcome back, {userProfile.display_name}! 🎉
              </h1>
              <p className="text-xl text-gray-600">
                Your Story Library ({stories.length} stories)
              </p>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-100 rounded-2xl p-6">
              <p className="text-3xl font-bold text-blue-800">{userProfile.story_count}</p>
              <p className="text-blue-600 font-medium">Stories Created</p>
            </div>
            <div className="bg-green-100 rounded-2xl p-6">
              <p className="text-3xl font-bold text-green-800">
                {Math.floor(userProfile.total_recording_time / 60)}m {userProfile.total_recording_time % 60}s
              </p>
              <p className="text-green-600 font-medium">Recording Time</p>
            </div>
            <div className="bg-purple-100 rounded-2xl p-6">
              <p className="text-3xl font-bold text-purple-800 capitalize">
                {userProfile.subscription_status}
              </p>
              <p className="text-purple-600 font-medium">Plan Status</p>
            </div>
          </div>

          {needsSubscription() && userProfile.subscription_status !== 'active' && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-6 mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                You've reached your free limit! 🎨
              </h3>
              <p className="text-white mb-4">
                {userProfile.story_count >= 15
                  ? "You've created 15 stories! "
                  : "You've used 5 minutes of recording! "}
                Subscribe to continue creating unlimited stories.
              </p>
              <button className="bg-white text-orange-600 px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                Subscribe Now - $9.99/month
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={onReadLibrary}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-6 rounded-2xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
            >
              <Library className="w-6 h-6" />
              Story Library
            </button>

            <button
              onClick={onGames}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-6 rounded-2xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
            >
              <Gamepad2 className="w-6 h-6" />
              Play Games
            </button>

            <button
              onClick={onChallenges}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-6 rounded-2xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
            >
              <Trophy className="w-6 h-6" />
              Challenges
            </button>

            {canCreateStory() && (
              <button
                onClick={onCreateNew}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-6 rounded-2xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3 lg:col-span-3"
              >
                <Plus className="w-6 h-6" />
                Create New Story
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-purple-600" />
            My Stories
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">Loading your stories...</p>
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 mb-4">No stories yet!</p>
              <p className="text-gray-500">Create your first story to see it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{story.title}</h3>
                  <p className="text-gray-600 mb-4">
                    {story.theme} • by {story.author_name}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {new Date(story.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewStory(story.id)}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => deleteStory(story.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
