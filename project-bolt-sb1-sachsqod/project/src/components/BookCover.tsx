import { useState, useEffect, useRef } from 'react';
import { Camera, Sparkles, Download, Home, BookOpen, Play, Pause, StopCircle, Volume2 } from 'lucide-react';
import { StoryData } from '../types/story';
import { supabase } from '../lib/supabase';

interface BookCoverProps {
  storyData: StoryData;
  onSave: (storyId: string) => void;
  onNewStory: () => void;
}

export function BookCover({ storyData, onSave, onNewStory }: BookCoverProps) {
  const [authorImage, setAuthorImage] = useState(storyData.authorImage || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [currentReadingPage, setCurrentReadingPage] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAuthorImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    return () => {
      if (speechRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const readStory = () => {
    if (!window.speechSynthesis) {
      alert('Sorry, your browser does not support text-to-speech!');
      return;
    }

    window.speechSynthesis.cancel();
    setIsReading(true);
    setIsPaused(false);
    setCurrentReadingPage(-1);

    const readTitle = () => {
      return new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(
          `${storyData.title}. A ${storyData.theme} story by ${storyData.authorName}.`
        );
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.onend = () => resolve();
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      });
    };

    const readPages = async () => {
      await readTitle();

      for (let i = 0; i < storyData.pages.length; i++) {
        if (!isReading) break;

        setCurrentReadingPage(i);

        await new Promise<void>((resolve) => {
          const utterance = new SpeechSynthesisUtterance(storyData.pages[i].content);
          utterance.rate = 0.85;
          utterance.pitch = 1.1;
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          speechRef.current = utterance;
          window.speechSynthesis.speak(utterance);
        });

        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      setIsReading(false);
      setCurrentReadingPage(-1);
    };

    readPages();
  };

  const pauseReading = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeReading = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopReading = () => {
    window.speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
    setCurrentReadingPage(-1);
  };

  const saveStory = async () => {
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user?.id,
          title: storyData.title,
          raw_transcript: storyData.transcript,
          enhanced_story: storyData.enhancedStory,
          author_name: storyData.authorName,
          author_image_url: authorImage,
          theme: storyData.theme,
          color_scheme: storyData.colorScheme,
        })
        .select()
        .single();

      if (storyError) throw storyError;

      if (story) {
        const charactersToInsert = storyData.characters.map((char, idx) => ({
          story_id: story.id,
          name: char.name,
          description: char.description,
          appearance: { emoji: char.emoji, color: char.color },
          role: char.role,
          position: idx,
        }));

        const { error: charError } = await supabase
          .from('story_characters')
          .insert(charactersToInsert);

        if (charError) throw charError;

        const pagesToInsert = storyData.pages.map((page) => ({
          story_id: story.id,
          page_number: page.pageNumber,
          content: page.content,
          scene_description: page.sceneDescription,
          animation_style: page.animationStyle,
          background_color: page.backgroundColor,
        }));

        const { error: pageError } = await supabase
          .from('story_pages')
          .insert(pagesToInsert);

        if (pageError) throw pageError;

        onSave(story.id);
      }
    } catch (error) {
      console.error('Error saving story:', error);
      alert('Oops! Could not save your story. Please try again!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-800 via-amber-600 to-amber-800 flex items-center justify-center p-8">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-6">
          <h2 className="text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3 drop-shadow-lg">
            <Sparkles className="w-12 h-12 text-yellow-300 animate-pulse" />
            Your Book is Ready!
            <Sparkles className="w-12 h-12 text-yellow-300 animate-pulse" />
          </h2>
          <p className="text-2xl text-amber-100 font-bold">A masterpiece by {storyData.authorName}</p>
        </div>

        <div className="relative animate-zoom-in">
          <div className="relative bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl shadow-2xl p-3 border-8 border-amber-900 transform hover:scale-105 transition-transform duration-300">
            <div
              className="relative rounded-xl p-12 min-h-[700px] flex flex-col justify-center items-center text-center shadow-inner border-4 border-amber-200"
              style={{
                background: `linear-gradient(135deg, ${storyData.colorScheme.primary}, ${storyData.colorScheme.secondary})`,
              }}
            >
              <div className="absolute top-8 left-8 text-6xl opacity-20">📖</div>
              <div className="absolute top-8 right-8 text-6xl opacity-20">✨</div>
              <div className="absolute bottom-8 left-8 text-6xl opacity-20">🌟</div>
              <div className="absolute bottom-8 right-8 text-6xl opacity-20">📚</div>

              <div className="mb-8">
                {authorImage ? (
                  <div className="relative inline-block">
                    <img
                      src={authorImage}
                      alt="Author"
                      className="w-40 h-40 rounded-full border-6 border-white shadow-2xl mx-auto object-cover"
                    />
                    <label className="absolute bottom-2 right-2 bg-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <Camera className="w-6 h-6 text-gray-600" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="inline-block cursor-pointer group">
                    <div className="w-40 h-40 rounded-full border-6 border-dashed border-white bg-white bg-opacity-20 flex flex-col items-center justify-center mx-auto hover:bg-opacity-40 transition-all group-hover:scale-110">
                      <Camera className="w-16 h-16 text-white mb-2" />
                      <span className="text-white text-sm font-bold">Add Photo</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="mb-6">
                <div className="inline-block bg-white bg-opacity-20 px-8 py-3 rounded-full mb-4">
                  <BookOpen className="inline-block w-8 h-8 text-white mr-2" />
                  <span className="text-white text-xl font-bold uppercase tracking-wider">
                    {storyData.theme} Tale
                  </span>
                </div>
              </div>

              <h1 className="text-7xl font-bold text-white mb-8 drop-shadow-2xl leading-tight px-4">
                {storyData.title}
              </h1>

              <div className="bg-white bg-opacity-95 rounded-2xl px-10 py-5 mb-8 shadow-xl">
                <p className="text-4xl text-gray-800 font-bold">
                  Written & Illustrated by
                </p>
                <p className="text-5xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 font-bold mt-2">
                  {storyData.authorName}
                </p>
              </div>

              <div className="flex justify-center gap-6 mb-6 flex-wrap">
                {storyData.characters.map((char, idx) => (
                  <div
                    key={idx}
                    className="text-7xl p-5 bg-white rounded-2xl shadow-2xl transform hover:scale-110 hover:rotate-6 transition-all animate-bounce-in"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    {char.emoji}
                  </div>
                ))}
              </div>

              <div className="bg-white bg-opacity-90 rounded-xl px-8 py-4 shadow-lg">
                <p className="text-gray-800 text-xl font-bold">
                  {storyData.pages.length} Magical Pages of Adventure
                </p>
              </div>
            </div>

            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-2 h-[96%] bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 shadow-inner rounded-r"></div>

            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-900 opacity-50"></div>
            <div className="absolute left-1 top-0 bottom-0 w-1 bg-amber-800 opacity-30"></div>
          </div>

          <div className="absolute -bottom-2 left-4 right-4 h-4 bg-amber-950 opacity-50 blur-sm rounded-b-2xl"></div>
        </div>

        {isReading && currentReadingPage >= 0 && (
          <div className="mt-6 bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Volume2 className="w-8 h-8 text-purple-600 animate-pulse" />
                <span className="text-2xl font-bold text-gray-800">
                  Reading Page {currentReadingPage + 1} of {storyData.pages.length}
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6">
              <p className="text-xl text-gray-800 leading-relaxed">
                {storyData.pages[currentReadingPage].content}
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white bg-opacity-90 rounded-2xl p-6 shadow-xl">
          <h3 className="text-3xl font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-3">
            <Volume2 className="w-8 h-8 text-purple-600" />
            Listen to Your Story!
          </h3>

          {!isReading ? (
            <button
              onClick={readStory}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-6 rounded-2xl text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
            >
              <Play className="w-10 h-10" />
              Read My Story Aloud!
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {!isPaused ? (
                <button
                  onClick={pauseReading}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-6 rounded-2xl text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                  <Pause className="w-10 h-10" />
                  Pause
                </button>
              ) : (
                <button
                  onClick={resumeReading}
                  className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-6 rounded-2xl text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                  <Play className="w-10 h-10" />
                  Resume
                </button>
              )}
              <button
                onClick={stopReading}
                className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-8 py-6 rounded-2xl text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                <StopCircle className="w-10 h-10" />
                Stop
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <button
            onClick={saveStory}
            disabled={isSaving}
            className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-6 rounded-2xl text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <Download className={`w-10 h-10 ${isSaving ? 'animate-bounce' : ''}`} />
            {isSaving ? 'Saving Your Masterpiece...' : 'Save My Book!'}
          </button>

          <button
            onClick={onNewStory}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-6 rounded-2xl text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
          >
            <Home className="w-10 h-10" />
            Create Another Story!
          </button>
        </div>
      </div>
    </div>
  );
}
