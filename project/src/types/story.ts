export type AppStep = 'welcome' | 'record' | 'enhance' | 'characters' | 'preview' | 'book' | 'gallery' | 'library' | 'readLibrary' | 'games' | 'challenges';

export interface StoryData {
  id?: string;
  title: string;
  authorName: string;
  authorImage?: string;
  transcript: string;
  enhancedStory: string;
  theme: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  characters: Character[];
  pages: Page[];
}

export interface Character {
  id?: string;
  name: string;
  description: string;
  role: 'main' | 'supporting';
  color: string;
  emoji: string;
}

export interface Page {
  id?: string;
  pageNumber: number;
  content: string;
  sceneDescription: string;
  animationStyle: 'fade' | 'slide' | 'zoom' | 'bounce';
  backgroundColor: string;
}
