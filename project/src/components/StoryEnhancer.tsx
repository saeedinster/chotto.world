import { useState } from 'react';
import { Sparkles, ArrowRight, Wand2 } from 'lucide-react';

interface StoryEnhancerProps {
  transcript: string;
  onComplete: (enhancedStory: string, theme: string, title: string) => void;
}

const themes = [
  { name: 'adventure', color: 'bg-orange-500', emoji: '🏔️' },
  { name: 'fantasy', color: 'bg-purple-500', emoji: '🦄' },
  { name: 'space', color: 'bg-blue-600', emoji: '🚀' },
  { name: 'ocean', color: 'bg-cyan-500', emoji: '🌊' },
  { name: 'jungle', color: 'bg-green-600', emoji: '🦁' },
  { name: 'magical', color: 'bg-pink-500', emoji: '✨' },
];

export function StoryEnhancer({ transcript, onComplete }: StoryEnhancerProps) {
  const [selectedTheme, setSelectedTheme] = useState('adventure');
  const [title, setTitle] = useState('');
  const [enhancedStory, setEnhancedStory] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  const enhanceStory = () => {
    setIsEnhancing(true);

    setTimeout(() => {
      const sentences = transcript.split(/[.!?]+/).filter(s => s.trim());
      const enhanced = sentences
        .map(sentence => {
          const trimmed = sentence.trim();
          if (!trimmed) return '';

          const descriptors = ['exciting', 'magical', 'wonderful', 'amazing', 'incredible', 'fantastic'];
          const descriptor = descriptors[Math.floor(Math.random() * descriptors.length)];

          return trimmed.charAt(0).toUpperCase() + trimmed.slice(1) +
                 (Math.random() > 0.5 ? ` It was so ${descriptor}!` : '.');
        })
        .filter(s => s)
        .join(' ');

      setEnhancedStory(enhanced || transcript);
      setIsEnhancing(false);
    }, 2000);
  };

  const handleComplete = () => {
    if (enhancedStory && title.trim() && selectedTheme) {
      onComplete(enhancedStory, selectedTheme, title.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-300 via-pink-300 to-red-300 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-yellow-500" />
            Make It Magical!
          </h2>

          <div className="mb-6">
            <label className="block text-xl font-bold text-gray-700 mb-3">
              What's your story called?
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your story an amazing title..."
              className="w-full px-6 py-4 border-4 border-purple-300 rounded-2xl text-xl focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xl font-bold text-gray-700 mb-3">
              Choose your story theme:
            </label>
            <div className="grid grid-cols-3 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => setSelectedTheme(theme.name)}
                  className={`${theme.color} ${
                    selectedTheme === theme.name
                      ? 'ring-4 ring-yellow-400 scale-105'
                      : 'opacity-70 hover:opacity-100'
                  } text-white px-6 py-4 rounded-2xl text-lg font-bold shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2`}
                >
                  <span className="text-3xl">{theme.emoji}</span>
                  <span className="capitalize">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {!enhancedStory ? (
            <div className="text-center mb-6">
              <button
                onClick={enhanceStory}
                disabled={isEnhancing}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-10 py-6 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center gap-3 mx-auto disabled:opacity-50"
              >
                <Wand2 className={`w-8 h-8 ${isEnhancing ? 'animate-spin' : ''}`} />
                {isEnhancing ? 'Adding Magic...' : 'Add Magic to Story!'}
              </button>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-br from-yellow-100 to-orange-100 border-4 border-yellow-400 rounded-2xl p-6 mb-6 max-h-[400px] overflow-y-auto">
                <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-600" />
                  Your Enhanced Story:
                </h3>
                <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {enhancedStory}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={enhanceStory}
                  className="flex-1 bg-yellow-500 text-white px-6 py-4 rounded-2xl text-lg font-bold shadow-lg hover:bg-yellow-600 transform hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-6 h-6" />
                  Try Again
                </button>

                {title && (
                  <button
                    onClick={handleComplete}
                    className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-4 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-6 h-6" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
