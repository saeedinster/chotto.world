import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, RotateCcw } from 'lucide-react';

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryGameProps {
  game: any;
  onComplete: (score: number, timeTaken: number) => void;
  onBack: () => void;
}

const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'];

export function MemoryGame({ game, onComplete, onBack }: MemoryGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [startTime] = useState(Date.now());
  const [gameComplete, setGameComplete] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (flippedCards.length === 2) {
      checkMatch();
    }
  }, [flippedCards]);

  const initializeGame = () => {
    const pairCount = game.config?.pairs || 6;
    const selectedEmojis = emojis.slice(0, pairCount);
    const gameCards = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(gameCards);
  };

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched) {
      return;
    }

    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);
    setFlippedCards([...flippedCards, id]);
  };

  const checkMatch = () => {
    setTimeout(() => {
      const [first, second] = flippedCards;
      const newCards = [...cards];

      if (newCards[first].emoji === newCards[second].emoji) {
        newCards[first].isMatched = true;
        newCards[second].isMatched = true;
        const newMatches = matches + 1;
        setMatches(newMatches);

        if (newMatches === (game.config?.pairs || 6)) {
          const timeTaken = Math.floor((Date.now() - startTime) / 1000);
          const calculatedScore = Math.max(1000 - (moves * 10) - (timeTaken * 5), 100);
          setScore(calculatedScore);
          setGameComplete(true);
          onComplete(calculatedScore, timeTaken);
        }
      } else {
        newCards[first].isFlipped = false;
        newCards[second].isFlipped = false;
      }

      setCards(newCards);
      setFlippedCards([]);
      setMoves(moves + 1);
    }, 800);
  };

  const resetGame = () => {
    initializeGame();
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameComplete(false);
    setScore(0);
  };

  if (gameComplete) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6 animate-bounce" />
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Awesome Job!</h2>
          <div className="text-6xl font-bold text-purple-600 mb-4">{score}</div>
          <p className="text-2xl text-gray-700 mb-2">Moves: {moves}</p>
          <p className="text-xl text-gray-600 mb-8">
            You matched all pairs! Keep playing to improve your score!
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
          <div className="flex justify-center gap-8 text-xl">
            <div className="bg-purple-100 px-6 py-3 rounded-xl">
              <span className="font-bold text-purple-800">Moves: {moves}</span>
            </div>
            <div className="bg-green-100 px-6 py-3 rounded-xl">
              <span className="font-bold text-green-800">
                Matches: {matches}/{game.config?.pairs || 6}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isMatched}
              className={`aspect-square rounded-2xl text-5xl flex items-center justify-center font-bold shadow-lg transform transition-all duration-300 ${
                card.isFlipped || card.isMatched
                  ? 'bg-white scale-105'
                  : 'bg-gradient-to-br from-purple-500 to-pink-600 hover:scale-110'
              } ${card.isMatched ? 'opacity-50' : ''}`}
            >
              {card.isFlipped || card.isMatched ? card.emoji : '❓'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
