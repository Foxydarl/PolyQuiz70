"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface Game {
  id: string;
  title: string;
  description: string | null;
  code: string;
  isActive: boolean;
  createdAt: string;
  questions: {
    id: string;
    text: string;
    options: string[];
    correct: number;
  }[];
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch("/api/games");
      if (!response.ok) {
        throw new Error("Ошибка при получении игр");
      }
      const data = await response.json();
      setGames(data.games);
    } catch (error) {
      toast.error("Ошибка при загрузке игр");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGameStatus = async (gameId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/games/${gameId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Ошибка при обновлении статуса игры");
      }

      await fetchGames();
      toast.success(
        `Игра ${currentStatus ? "остановлена" : "запущена"} успешно!`
      );
    } catch (error) {
      toast.error("Ошибка при обновлении статуса игры");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Мои игры</h1>
        <Link
          href="/dashboard/games/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Создать новую игру
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <div
            key={game.id}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">{game.title}</h3>
              {game.description && (
                <p className="mt-1 text-sm text-gray-500">{game.description}</p>
              )}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">
                  Код игры:{" "}
                  <span className="font-mono text-indigo-600">{game.code}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Количество вопросов: {game.questions.length}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => toggleGameStatus(game.id, game.isActive)}
                  className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${
                    game.isActive
                      ? "text-red-700 bg-red-100 hover:bg-red-200"
                      : "text-green-700 bg-green-100 hover:bg-green-200"
                  }`}
                >
                  {game.isActive ? "Остановить" : "Запустить"}
                </button>
                <Link
                  href={`/dashboard/games/${game.id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Редактировать
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {games.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">У вас пока нет созданных игр</p>
          <Link
            href="/dashboard/games/create"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Создать первую игру
          </Link>
        </div>
      )}
    </div>
  );
} 