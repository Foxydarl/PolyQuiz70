"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Confetti from "react-confetti";

interface Question {
  id: string;
  text: string;
  options: string[];
  correct: number;
}

interface Game {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
}

export default function GamePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [game, setGame] = useState<Game | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  useEffect(() => {
    fetchGame();
  }, [params.id]);

  const fetchGame = async () => {
    try {
      const response = await fetch(`/api/games/${params.id}/play`);
      if (!response.ok) {
        throw new Error("Ошибка при получении игры");
      }
      const data = await response.json();
      setGame(data.game);
    } catch (error) {
      toast.error("Ошибка при загрузке игры");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) return;

    setIsAnswerSubmitted(true);
    const currentQuestion = game?.questions[currentQuestionIndex];

    if (selectedAnswer === currentQuestion?.correct) {
      setScore(score + 1);
      toast.success("Правильный ответ!");
    } else {
      toast.error("Неправильный ответ!");
    }

    // Ждем 2 секунды перед следующим вопросом
    setTimeout(() => {
      if (currentQuestionIndex === (game?.questions.length || 0) - 1) {
        setShowConfetti(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setIsAnswerSubmitted(false);
      }
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Игра не найдена</p>
      </div>
    );
  }

  const currentQuestion = game.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{game.title}</h1>
            {game.description && (
              <p className="mt-1 text-gray-500">{game.description}</p>
            )}
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Вопрос {currentQuestionIndex + 1} из {game.questions.length}
              </p>
              <p className="text-sm font-medium text-indigo-600">
                Счет: {score}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {currentQuestion.text}
              </h2>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswerSubmitted}
                  className={`w-full p-4 text-left rounded-lg border ${
                    selectedAnswer === index
                      ? isAnswerSubmitted
                        ? index === currentQuestion.correct
                          ? "bg-green-100 border-green-500"
                          : "bg-red-100 border-red-500"
                        : "bg-indigo-50 border-indigo-500"
                      : "bg-white border-gray-300 hover:border-indigo-500"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {!isAnswerSubmitted && selectedAnswer !== null && (
              <button
                onClick={handleSubmitAnswer}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Подтвердить ответ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 