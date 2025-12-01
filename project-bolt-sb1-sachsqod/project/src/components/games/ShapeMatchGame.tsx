import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, RotateCcw } from 'lucide-react';

interface Shape {
  type: 'circle' | 'square' | 'triangle';
  color: string;
}

interface ShapeMatchGameProps {
  game: any;
  onComplete: (score: number, timeTaken: number) => void;
  onBack: () => void;
}

const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

export function ShapeMatchGame({ game, onComplete, onBack }: ShapeMatchGameProps) {
  const [targetShape, setTargetShape] = useState<Shape | null>(null);
  const [options, setOptions] = useState<Shape[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [startTime] = useState(Date.now());
  const [gameComplete, setGameComplete] = useState(false);
  const maxRounds = 10;

  useEffect(() => {
    generateNewRound();
  }, []);

  const generateNewRound = () => {
    const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const target: Shape = { type: randomShape, color: randomColor };
    setTargetShape(target);

    const correctOption = { ...target };
    const wrongOptions: Shape[] = [];

    for (let i = 0; i < 3; i++) {
      const wrongShape = shapes[Math.floor(Math.random() * shapes.length)];
      const wrongColor = colors[Math.floor(Math.random() * colors.length)];
      if (wrongShape !== target.type || wrongColor !== target.color) {
        wrongOptions.push({ type: wrongShape, color: wrongColor });
      }
    }

    const allOptions = [correctOption, ...wrongOptions]
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);

    setOptions(allOptions);
    setFeedback(null);
  };

  const handleShapeClick = (shape: Shape) => {
    if (!targetShape) return;

    const isCorrect = shape.type === targetShape.type && shape.color === targetShape.color;
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setScore(score + 100);
    }

    setTimeout(() => {
      if (round < maxRounds) {
        setRound(round + 1);
        generateNewRound();
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
    generateNewRound();
  };

  const renderShape = (shape: Shape, size: string = 'w-24 h-24') => {
    const colorClass = {
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-400',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
    }[shape.color];

    if (shape.type === 'circle') {
      return <div className={`${size} ${colorClass} rounded-full`} />;
    } else if (shape.type === 'square') {
      return <div className={`${size} ${colorClass} rounded-lg`} />;
    } else {
      return (
        <div className={`${size} relative`}>
          <div
            className={`absolute inset-0 ${colorClass}`}
            style={{
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            }}
          />
        </div>
      );
    }
  };

  if (gameComplete) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6 animate-bounce" />
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Awesome Matching!</h2>
          <div className="text-6xl font-bold text-purple-600 mb-4">{score}</div>
          <p className="text-2xl text-gray-700 mb-8">
            You matched {score / 100} out of {maxRounds} shapes correctly!
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

        {targetShape && feedback === null && (
          <>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8 mb-6">
              <p className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Find this shape!
              </p>
              <div className="flex justify-center">
                {renderShape(targetShape, 'w-32 h-32')}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {options.map((shape, index) => (
                <button
                  key={index}
                  onClick={() => handleShapeClick(shape)}
                  className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-110 transition-all flex items-center justify-center"
                >
                  {renderShape(shape)}
                </button>
              ))}
            </div>
          </>
        )}

        {feedback === 'correct' && (
          <div className="bg-green-100 border-4 border-green-500 rounded-2xl p-8 text-center animate-bounce-in">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-3xl font-bold text-green-800">Perfect Match!</p>
            <p className="text-xl text-green-700 mt-2">You found it!</p>
          </div>
        )}

        {feedback === 'wrong' && (
          <div className="bg-red-100 border-4 border-red-500 rounded-2xl p-8 text-center animate-bounce-in">
            <div className="text-6xl mb-4">💪</div>
            <p className="text-3xl font-bold text-red-800">Try Again!</p>
            <p className="text-xl text-red-700 mt-2">Keep looking for the right shape!</p>
          </div>
        )}
      </div>
    </div>
  );
}
