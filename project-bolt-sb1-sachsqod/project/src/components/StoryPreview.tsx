import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, BookOpen } from 'lucide-react';
import { Page, Character } from '../types/story';

interface StoryPreviewProps {
  story: string;
  characters: Character[];
  theme: string;
  title: string;
  authorName: string;
  onComplete: (pages: Page[]) => void;
}

const animationStyles = ['fade', 'slide', 'zoom', 'bounce'] as const;

export function StoryPreview({ story, characters, theme, title, authorName, onComplete }: StoryPreviewProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(-1);

  useEffect(() => {
    const sentences = story.split(/[.!?]+/).filter(s => s.trim());
    const pageGroups: string[][] = [];

    for (let i = 0; i < sentences.length; i += 2) {
      pageGroups.push(sentences.slice(i, i + 2));
    }

    const themeColors: Record<string, string[]> = {
      adventure: ['#FFA07A', '#FFD700', '#FF6347', '#FFA500'],
      fantasy: ['#E6E6FA', '#DDA0DD', '#BA55D3', '#9370DB'],
      space: ['#000033', '#1E3A8A', '#3B82F6', '#60A5FA'],
      ocean: ['#00CED1', '#40E0D0', '#48D1CC', '#AFEEEE'],
      jungle: ['#228B22', '#32CD32', '#90EE90', '#98FB98'],
      magical: ['#FFB6C1', '#FFC0CB', '#FFD700', '#FF69B4'],
    };

    const colors = themeColors[theme] || themeColors.adventure;

    const generatedPages: Page[] = pageGroups.map((group, index) => ({
      pageNumber: index + 1,
      content: group.join('. ') + '.',
      sceneDescription: `Scene ${index + 1}`,
      animationStyle: animationStyles[index % animationStyles.length],
      backgroundColor: colors[index % colors.length],
    }));

    setPages(generatedPages);
  }, [story, theme]);

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleComplete = () => {
    onComplete(pages);
  };

  if (pages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Creating your pages...</div>
      </div>
    );
  }

  const themeColors: Record<string, string[]> = {
    adventure: ['#FFA07A', '#FFD700', '#FF6347', '#FFA500'],
    fantasy: ['#E6E6FA', '#DDA0DD', '#BA55D3', '#9370DB'],
    space: ['#000033', '#1E3A8A', '#3B82F6', '#60A5FA'],
    ocean: ['#00CED1', '#40E0D0', '#48D1CC', '#AFEEEE'],
    jungle: ['#228B22', '#32CD32', '#90EE90', '#98FB98'],
    magical: ['#FFB6C1', '#FFC0CB', '#FFD700', '#FF69B4'],
  };

  const colors = themeColors[theme] || themeColors.adventure;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-800 via-amber-600 to-amber-800 flex items-center justify-center p-8">
      <div className="relative max-w-5xl w-full">
        {currentPage === -1 ? (
          <div
            key="cover"
            className="perspective-1000 animate-fade-in"
          >
            <div className="relative bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl shadow-2xl p-3 border-8 border-amber-900">
              <div
                className="relative rounded-xl p-12 min-h-[600px] flex flex-col justify-center items-center text-center shadow-inner border-4 border-amber-200"
                style={{
                  background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                }}
              >
                <div className="absolute top-8 left-8 text-6xl opacity-20">📖</div>
                <div className="absolute bottom-8 right-8 text-6xl opacity-20">✨</div>

                <div className="mb-8">
                  <div className="flex justify-center gap-4 flex-wrap mb-6">
                    {characters.slice(0, 3).map((char, idx) => (
                      <div
                        key={idx}
                        className="text-7xl p-4 bg-white rounded-full shadow-lg animate-bounce-in"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        {char.emoji}
                      </div>
                    ))}
                  </div>
                </div>

                <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-2xl leading-tight">
                  {title}
                </h1>

                <div className="bg-white bg-opacity-90 rounded-2xl px-8 py-4 mb-6">
                  <p className="text-3xl text-gray-800 font-bold">By {authorName}</p>
                </div>

                <div className="mt-auto">
                  <div className="bg-white bg-opacity-80 rounded-xl px-6 py-3">
                    <p className="text-lg text-gray-700 font-semibold capitalize">
                      A {theme} adventure
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-[95%] bg-amber-950 shadow-inner"></div>
            </div>
          </div>
        ) : (
          <div
            key={`page-${currentPage}`}
            className="perspective-1000 animate-fade-in"
          >
            <div className="relative bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl shadow-2xl p-3 border-8 border-amber-900">
              <div
                className="relative rounded-xl p-12 min-h-[600px] flex flex-col justify-between shadow-inner border-4 border-amber-200"
                style={{ backgroundColor: pages[currentPage].backgroundColor }}
              >
                <div className="absolute top-4 left-4 text-white text-sm font-bold opacity-60">
                  Page {currentPage + 1}
                </div>

                <div className="flex-1 flex flex-col justify-center items-center text-center">
                  <div className="mb-8">
                    <div className="flex justify-center gap-4 flex-wrap">
                      {characters.map((char, idx) => (
                        <div
                          key={idx}
                          className="text-6xl p-4 bg-white rounded-full shadow-lg transform hover:scale-110 transition-transform"
                        >
                          {char.emoji}
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-3xl text-white font-bold leading-relaxed px-8 drop-shadow-lg">
                    {pages[currentPage].content}
                  </p>
                </div>

                <div className="text-center text-white text-lg font-bold opacity-60">
                  {title}
                </div>
              </div>

              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-[95%] bg-amber-950 shadow-inner"></div>
            </div>
          </div>
        )}

        <div className="flex justify-center items-center gap-6 mt-8">
          <button
            onClick={prevPage}
            disabled={currentPage === -1}
            className="bg-amber-900 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-amber-800 disabled:opacity-30 disabled:cursor-not-allowed transform hover:scale-110 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-6 h-6" />
            Previous
          </button>

          <div className="bg-white px-8 py-4 rounded-full font-bold text-gray-800 shadow-lg text-lg">
            {currentPage === -1 ? 'Cover' : `Page ${currentPage + 1} of ${pages.length}`}
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === pages.length - 1}
            className="bg-amber-900 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-amber-800 disabled:opacity-30 disabled:cursor-not-allowed transform hover:scale-110 transition-all flex items-center gap-2"
          >
            Next
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {currentPage === pages.length - 1 && (
          <button
            onClick={handleComplete}
            className="w-full mt-6 bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-5 rounded-2xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            Save My Book!
            <ArrowRight className="w-8 h-8" />
          </button>
        )}
      </div>
    </div>
  );
}
