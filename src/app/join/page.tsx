"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function JoinGamePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [gameCode, setGameCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/games/join/${gameCode}`);
      if (!response.ok) {
        throw new Error("Ошибка при подключении к игре");
      }

      const data = await response.json();
      router.push(`/game/${data.game.id}`);
    } catch (error) {
      toast.error("Ошибка при подключении к игре");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Подключиться к игре
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="gameCode"
              className="block text-sm font-medium text-gray-700"
            >
              Код игры
            </label>
            <input
              id="gameCode"
              name="gameCode"
              type="text"
              required
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Введите код игры"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? "Подключение..." : "Подключиться"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 