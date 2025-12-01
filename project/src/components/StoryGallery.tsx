import { useEffect, useState } from 'react';
import { BookOpen, ArrowLeft, Sparkles } from 'lucide-react';
import { supabase, Story } from '../lib/supabase';

interface StoryGalleryProps {
  onBack: () => void;
}

export function StoryGallery({ onBack }: StoryGalleryProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setStories(data || []);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">
          Loading stories...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-purple-600" />
              Story Gallery
            </h2>
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </div>

          {stories.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-2xl text-gray-400 font-bold">No stories yet!</p>
              <p className="text-lg text-gray-400">Create your first story to see it here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 transition-all duration-300 cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${story.color_scheme.primary}, ${story.color_scheme.secondary})`,
                  }}
                >
                  <div className="p-6 text-white">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-2xl font-bold flex-1 drop-shadow-lg">
                        {story.title}
                      </h3>
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>

                    <div className="bg-white bg-opacity-90 rounded-xl p-3 mb-3">
                      <p className="text-gray-800 font-bold">By {story.author_name}</p>
                      <p className="text-gray-600 text-sm capitalize">{story.theme} story</p>
                    </div>

                    {story.author_image_url && (
                      <div className="flex justify-center mb-3">
                        <img
                          src={story.author_image_url}
                          alt={story.author_name}
                          className="w-16 h-16 rounded-full border-2 border-white shadow-lg object-cover"
                        />
                      </div>
                    )}

                    <p className="text-white text-sm line-clamp-3 drop-shadow">
                      {story.enhanced_story || story.raw_transcript}
                    </p>

                    <div className="mt-4 text-xs text-white opacity-75">
                      {new Date(story.created_at).toLocaleDateString()}
                    </div>
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
