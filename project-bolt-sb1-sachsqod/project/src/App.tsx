import { useState, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { VoiceRecorder } from './components/VoiceRecorder';
import { StoryEnhancer } from './components/StoryEnhancer';
import { CharacterCreator } from './components/CharacterCreator';
import { StoryPreview } from './components/StoryPreview';
import { BookCover } from './components/BookCover';
import { StoryGallery } from './components/StoryGallery';
import { UserLibrary } from './components/UserLibrary';
import { StoryLibraryReader } from './components/StoryLibraryReader';
import { LearningGames } from './components/LearningGames';
import { DailyChallenges } from './components/DailyChallenges';
import { AppStep, StoryData, Character, Page } from './types/story';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';

function App() {
  const { user, userProfile, loading, logout, updateRecordingTime, canCreateStory, refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState<AppStep>('welcome');
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [storyData, setStoryData] = useState<StoryData>({
    title: '',
    authorName: '',
    transcript: '',
    enhancedStory: '',
    theme: 'adventure',
    colorScheme: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
    },
    characters: [],
    pages: [],
  });

  const handleStart = () => {
    if (user && !canCreateStory()) {
      alert('You have reached your free limit! Please subscribe to continue creating stories.');
      return;
    }
    setRecordingStartTime(Date.now());
    setCurrentStep('record');
  };

  const handleRecordComplete = async (transcript: string, authorName: string) => {
    if (user && recordingStartTime > 0) {
      const recordingSeconds = Math.floor((Date.now() - recordingStartTime) / 1000);
      await updateRecordingTime(recordingSeconds);
    }
    setStoryData((prev) => ({
      ...prev,
      transcript,
      authorName,
    }));
    setCurrentStep('enhance');
  };

  const handleEnhanceComplete = (enhancedStory: string, theme: string, title: string) => {
    const themeColors: Record<string, { primary: string; secondary: string; accent: string }> = {
      adventure: { primary: '#FF6B6B', secondary: '#FFA07A', accent: '#FFD700' },
      fantasy: { primary: '#BA55D3', secondary: '#DDA0DD', accent: '#E6E6FA' },
      space: { primary: '#1E3A8A', secondary: '#3B82F6', accent: '#60A5FA' },
      ocean: { primary: '#00CED1', secondary: '#40E0D0', accent: '#AFEEEE' },
      jungle: { primary: '#228B22', secondary: '#32CD32', accent: '#98FB98' },
      magical: { primary: '#FF69B4', secondary: '#FFB6C1', accent: '#FFD700' },
    };

    setStoryData((prev) => ({
      ...prev,
      title,
      enhancedStory,
      theme,
      colorScheme: themeColors[theme] || themeColors.adventure,
    }));
    setCurrentStep('characters');
  };

  const handleCharactersComplete = (characters: Character[]) => {
    setStoryData((prev) => ({
      ...prev,
      characters,
    }));
    setCurrentStep('preview');
  };

  const handlePreviewComplete = (pages: Page[]) => {
    setStoryData((prev) => ({
      ...prev,
      pages,
    }));
    setCurrentStep('book');
  };

  const handleSaveStory = async (storyId: string) => {
    console.log('Story saved with ID:', storyId);
    await refreshProfile();
    if (user) {
      setCurrentStep('library');
    } else {
      setCurrentStep('gallery');
    }
  };

  const handleNewStory = () => {
    setStoryData({
      title: '',
      authorName: '',
      transcript: '',
      enhancedStory: '',
      theme: 'adventure',
      colorScheme: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        accent: '#FFE66D',
      },
      characters: [],
      pages: [],
    });
    setCurrentStep('welcome');
  };

  const handleBackToWelcome = () => {
    if (user) {
      setCurrentStep('library');
    } else {
      setCurrentStep('welcome');
    }
  };

  useEffect(() => {
    if (!loading && user && userProfile && currentStep === 'welcome') {
      setCurrentStep('library');
    }
  }, [loading, user, userProfile, currentStep]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {currentStep === 'welcome' && (
        <WelcomeScreen
          onStart={handleStart}
          onReadLibrary={() => setCurrentStep('readLibrary')}
          onGames={() => setCurrentStep('games')}
          onChallenges={() => setCurrentStep('challenges')}
        />
      )}
      {currentStep === 'readLibrary' && (
        <StoryLibraryReader onBack={handleBackToWelcome} />
      )}
      {currentStep === 'games' && (
        <LearningGames onBack={handleBackToWelcome} onShowAuth={handleShowAuth} />
      )}
      {currentStep === 'challenges' && (
        <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={handleBackToWelcome}
              className="mb-6 bg-white text-gray-800 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
            >
              ← Back
            </button>
            <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10">
              <DailyChallenges />
            </div>
          </div>
        </div>
      )}
      {currentStep === 'library' && user && userProfile && (
        <UserLibrary
          onCreateNew={handleStart}
          onLogout={() => {
            logout();
            setCurrentStep('welcome');
          }}
          onReadLibrary={() => setCurrentStep('readLibrary')}
          onGames={() => setCurrentStep('games')}
          onChallenges={() => setCurrentStep('challenges')}
          userProfile={{
            display_name: userProfile.display_name,
            story_count: userProfile.story_count,
            total_recording_time: userProfile.total_recording_time,
            subscription_status: userProfile.subscription_status,
          }}
        />
      )}
      {currentStep === 'record' && <VoiceRecorder onComplete={handleRecordComplete} />}
      {currentStep === 'enhance' && (
        <StoryEnhancer transcript={storyData.transcript} onComplete={handleEnhanceComplete} />
      )}
      {currentStep === 'characters' && <CharacterCreator onComplete={handleCharactersComplete} />}
      {currentStep === 'preview' && (
        <StoryPreview
          story={storyData.enhancedStory}
          characters={storyData.characters}
          theme={storyData.theme}
          title={storyData.title}
          authorName={storyData.authorName}
          onComplete={handlePreviewComplete}
        />
      )}
      {currentStep === 'book' && (
        <BookCover storyData={storyData} onSave={handleSaveStory} onNewStory={handleNewStory} />
      )}
      {currentStep === 'gallery' && <StoryGallery onBack={handleBackToWelcome} />}
    </>
  );
}

export default App;
