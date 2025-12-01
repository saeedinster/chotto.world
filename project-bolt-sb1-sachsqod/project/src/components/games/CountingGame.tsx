import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, RotateCcw, Star } from 'lucide-react';

interface CountingGameProps {
  game: any;
  onComplete: (score: number, timeTaken: number) => void;
  onBack: () => void;
}

export function CountingGame({ game, onComplete, onBack }: CountingGameProps) {
  const [currentNumber, setCurrentNumber] = useState(1);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [startTime] = useState(Date.now());
  const [gameComplete, setGameComplete] = useState(false);
  const maxRounds = 10;
  const maxNumber = game.config?.maxNumber || 10;

  useEffect(() => {
    generateNewNumber();
  }, []);

  const generateNewNumber = () => {
    const num = Math.floor(Math.random() * maxNumber) + 1;
    setCurrentNumber(num);
    setUserAnswer('');
    setFeedback(null);
  };

  const handleSubmit = () => {
    const isCorrect = parseInt(userAnswer) === currentNumber;
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setScore(score + 100);
    }

    setTimeout(() => {
      if (round < maxRounds) {
        setRound(round + 1);
        generateNewNumber();
      } else {
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        setGameComplete(true);
        onComplete(score + (isCorrect ? 100 : 0), timeTaken);
      }
    }, 1500);
  };

  const resetGame = () => {
    setRound(1);
    setScore(0);
    setGameComplete(false);
    generateNewNumber();
  };

  if (gameComplete) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6 animate-bounce" />
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Great Counting!</h2>
          <div className="text-6xl font-bold text-purple-600 mb-4">{score}</div>
          <p className="text-2xl text-gray-700 mb-8">
            You counted {score / 100} out of {maxRounds} correctly!
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={resetGame}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-3"
            >
              <RotateCcw className="w-6 h-6" />
              Play Again
            </button>
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-3"
            >
              <ArrowLeft className="w-6 h-6" />
              Back to Games
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 bg-white text-gray-800 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Games
      </button>

      <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{game.name}</h2>
          <div className="flex justify-center gap-8 text-xl mb-6">
            <div className="bg-purple-100 px-6 py-3 rounded-xl">
              <span className="font-bold text-purple-800">Round: {round}/{maxRounds}</span>
            </div>
            <div className="bg-green-100 px-6 py-3 rounded-xl">
              <span className="font-bold text-green-800">Score: {score}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8 mb-6">
          <p className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Count the stars!
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {Array.from({ length: currentNumber }).map((_, i) => (
              <Star
                key={i}
                className="w-12 h-12 text-yellow-500 fill-yellow-400 animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>

        {feedback === null && (
          <div className="space-y-4">
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="How many stars?"
              className="w-full px-6 py-4 border-4 border-purple-300 rounded-xl text-3xl font-bold text-center focus:border-purple-500 focus:outline-none"
              min="0"
              max={maxNumber}
            />
            <button
              onClick={handleSubmit}
              disabled={!userAnswer}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-5 rounded-xl text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check Answer
            </button>
          </div>
        )}

        {feedback === 'correct' && (
          <div className="bg-green-100 border-4 border-green-500 rounded-2xl p-8 text-center animate-bounce-in">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-3xl font-bold text-green-800">Correct!</p>
            <p className="text-xl text-green-700 mt-2">Great counting!</p>
          </div>
        )}

        {feedback === 'wrong' && (
          <div className="bg-red-100 border-4 border-red-500 rounded-2xl p-8 text-center animate-bounce-in">
            <div className="text-6xl mb-4">💪</div>
            <p className="text-3xl font-bold text-red-800">Try Again!</p>
            <p className="text-xl text-red-700 mt-2">
              The answer was {currentNumber}. Keep practicing!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
