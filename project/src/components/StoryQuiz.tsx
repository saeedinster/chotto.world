import { useState } from 'react';
import { Check, X, Trophy, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface StoryQuizProps {
  storyId: string;
  storyTitle: string;
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

export function StoryQuiz({ storyId, storyTitle, questions, onComplete }: StoryQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const handleAnswerSelect = (answerIndex: number) => {
    if (isCorrect !== null) return;

    setSelectedAnswer(answerIndex);
    const correct = answerIndex === questions[currentQuestion].correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore(score + 1);
    }
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      setShowResult(true);
      await saveQuizResult();
    }
  };

  const saveQuizResult = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const finalScore = Math.round((score / questions.length) * 100);

      await supabase.from('quiz_results').insert({
        user_id: user.id,
        story_id: storyId,
        score: finalScore,
        questions_correct: score,
        total_questions: questions.length,
      });

      if (finalScore === 100) {
        await supabase.from('user_achievements').upsert({
          user_id: user.id,
          achievement_type: 'quiz_ace',
          metadata: { story_id: storyId },
        }, { onConflict: 'user_id,achievement_type' });
      }

      onComplete(finalScore);
    } catch (error) {
      console.error('Error saving quiz result:', error);
    }
  };

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
        <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6 animate-bounce" />
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Quiz Complete!</h2>
        <div className="text-6xl font-bold text-purple-600 mb-4">{percentage}%</div>
        <p className="text-2xl text-gray-700 mb-6">
          You got {score} out of {questions.length} questions correct!
        </p>

        {percentage === 100 && (
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400 rounded-2xl p-6 mb-6">
            <p className="text-xl font-bold text-yellow-800">🎉 Perfect Score! Achievement Unlocked! 🎉</p>
          </div>
        )}

        {percentage >= 80 && percentage < 100 && (
          <p className="text-xl text-green-600 font-bold mb-6">Excellent work!</p>
        )}

        {percentage >= 60 && percentage < 80 && (
          <p className="text-xl text-blue-600 font-bold mb-6">Good job! Keep reading!</p>
        )}

        {percentage < 60 && (
          <p className="text-xl text-orange-600 font-bold mb-6">Try reading the story again!</p>
        )}
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-bold text-gray-600">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-lg font-bold text-purple-600">
            Score: {score}/{currentQuestion + (isCorrect ? 1 : 0)}
          </span>
        </div>
        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-gray-800 mb-8">{question.question}</h2>

      <div className="space-y-4 mb-8">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isAnswered = isCorrect !== null;
          const isCorrectAnswer = index === question.correctAnswer;

          let buttonClass = 'bg-gray-100 hover:bg-gray-200';

          if (isAnswered) {
            if (isSelected && isCorrect) {
              buttonClass = 'bg-green-500 text-white';
            } else if (isSelected && !isCorrect) {
              buttonClass = 'bg-red-500 text-white';
            } else if (isCorrectAnswer) {
              buttonClass = 'bg-green-500 text-white';
            }
          } else if (isSelected) {
            buttonClass = 'bg-purple-200 border-2 border-purple-500';
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={isAnswered}
              className={`w-full p-6 rounded-2xl text-left text-xl font-bold transition-all transform hover:scale-102 ${buttonClass} flex items-center justify-between`}
            >
              <span>{option}</span>
              {isAnswered && isSelected && isCorrect && (
                <Check className="w-8 h-8" />
              )}
              {isAnswered && isSelected && !isCorrect && (
                <X className="w-8 h-8" />
              )}
              {isAnswered && isCorrectAnswer && !isSelected && (
                <Check className="w-8 h-8" />
              )}
            </button>
          );
        })}
      </div>

      {isCorrect !== null && (
        <button
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-5 rounded-2xl text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
        >
          {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
          <ArrowRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

export function generateQuizQuestions(storyTitle: string, ageRange: string, theme: string): QuizQuestion[] {
  const isYoungest = ageRange === '1-2';

  if (isYoungest) {
    return [
      {
        question: `What was this story about?`,
        options: [`${theme}`, 'space aliens', 'dinosaurs', 'robots'],
        correctAnswer: 0,
      },
      {
        question: 'Did you enjoy the story?',
        options: ['Yes!', 'No', 'Maybe', 'I don\'t know'],
        correctAnswer: 0,
      },
    ];
  }

  const questions: QuizQuestion[] = [
    {
      question: `What is the main lesson from "${storyTitle}"?`,
      options: [
        'Being kind to others',
        'Eating candy',
        'Playing video games',
        'Sleeping all day',
      ],
      correctAnswer: 0,
    },
    {
      question: 'How did the story make you feel?',
      options: ['Happy', 'Sad', 'Angry', 'Scared'],
      correctAnswer: 0,
    },
    {
      question: 'What should we learn from this story?',
      options: [
        'To be good and kind',
        'To be mean',
        'To never share',
        'To give up easily',
      ],
      correctAnswer: 0,
    },
  ];

  return questions;
}
