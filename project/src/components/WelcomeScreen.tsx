import { useState } from 'react';
import { Sparkles, Mic, BookOpen, LogIn, Library, Star, Gamepad2, Trophy } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';

interface WelcomeScreenProps {
  onStart: () => void;
  onReadLibrary: () => void;
  onGames: () => void;
  onChallenges: () => void;
}

export function WelcomeScreen({ onStart, onReadLibrary, onGames, onChallenges }: WelcomeScreenProps) {
  const [showAuth, setShowAuth] = useState(false);
  const { t } = useLanguage();

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          >
            <Star className="w-4 h-4 text-yellow-300 opacity-60" />
          </div>
        ))}
      </div>

      <div className="max-w-2xl w-full text-center relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-12 transform hover:scale-105 transition-transform duration-300 animate-fadeIn">
          <div className="flex justify-center mb-6">
            <div className="relative animate-wiggle">
              <BookOpen className="w-24 h-24 text-pink-500" />
              <Sparkles className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-spin-slow" />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-gray-800 mb-4 animate-slideDown">
            {t('welcome.title')} ✨
          </h1>

          <p className="text-2xl text-gray-600 mb-8 leading-relaxed">
            {t('welcome.subtitle')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-blue-100 rounded-2xl p-6 transform hover:rotate-2 transition-transform">
              <Mic className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-blue-800 text-lg">1. Tell Story</h3>
              <p className="text-blue-700 text-sm">Use your voice!</p>
            </div>

            <div className="bg-green-100 rounded-2xl p-6 transform hover:rotate-2 transition-transform">
              <Sparkles className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-bold text-green-800 text-lg">2. Add Magic</h3>
              <p className="text-green-700 text-sm">Make it beautiful!</p>
            </div>

            <div className="bg-purple-100 rounded-2xl p-6 transform hover:rotate-2 transition-transform">
              <BookOpen className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-bold text-purple-800 text-lg">3. Read Book</h3>
              <p className="text-purple-700 text-sm">Your story is ready!</p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setShowAuth(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-12 py-5 rounded-full text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 hover:from-blue-600 hover:to-cyan-700 flex items-center justify-center gap-3"
            >
              <LogIn className="w-8 h-8" />
              {t('welcome.signIn')} / {t('welcome.signUp')}
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={onReadLibrary}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-5 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 hover:from-green-600 hover:to-emerald-700 flex items-center justify-center gap-3"
              >
                <Library className="w-6 h-6" />
                {t('welcome.readLibrary')}
              </button>

              <button
                onClick={onGames}
                className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-5 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 hover:from-orange-600 hover:to-red-700 flex items-center justify-center gap-3"
              >
                <Gamepad2 className="w-6 h-6" />
                {t('welcome.games')}
              </button>
            </div>

            <button
              onClick={onChallenges}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-12 py-5 rounded-full text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 hover:from-yellow-600 hover:to-orange-700 flex items-center justify-center gap-3"
            >
              <Trophy className="w-8 h-8" />
              {t('welcome.challenges')}
            </button>

            <button
              onClick={onStart}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white px-12 py-5 rounded-full text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 hover:from-pink-600 hover:to-purple-700"
            >
              {t('welcome.createStory')}
            </button>
          </div>
        </div>
      </div>
    </div>

    {showAuth && (
      <AuthModal
        onClose={() => setShowAuth(false)}
        onSuccess={() => {
          setShowAuth(false);
          window.location.reload();
        }}
      />
    )}
    </>
  );
}
