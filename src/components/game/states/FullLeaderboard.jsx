import { useSocketContext } from "@/context/socket"
import Button from "@/components/Button"

export default function FullLeaderboard({ data: { leaderboard, totalQuestions } }) {
  const { socket } = useSocketContext()

  const handleUserClick = (user) => {
    console.log("Клик на пользователе:", user.username);
    socket.emit("manager:showUserStats", user.id)
  }

  return (
    <section className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-2">
      <h2 className="mb-6 text-5xl font-bold text-white drop-shadow-md">
        Полная таблица лидеров
      </h2>
      <div className="flex w-full flex-col gap-2 max-h-[70vh] overflow-y-auto mb-4">
        {leaderboard.map((user, key) => (
          <div
            key={key}
            className="flex w-full justify-between rounded-md bg-primary p-3 text-2xl font-bold text-white cursor-pointer hover:bg-primary/80 transition-colors"
            onClick={() => handleUserClick(user)}
          >
            <span className="drop-shadow-md">{`${key + 1}. ${user.username}`}</span>
            <div className="flex gap-4">
              <span className="drop-shadow-md">{`${user.correctAnswers || 0}/${totalQuestions}`}</span>
              <span className="text-sm text-gray-200 self-center">{`(${user.points} очков)`}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 relative z-50">
        <Button 
          className="bg-primary text-white relative z-50" 
          onClick={() => {
            console.log("Нажата кнопка 'Назад к подиуму'");
            socket.emit("manager:showPodium");
          }}
        >
          Назад к подиуму
        </Button>
      </div>
    </section>
  )
} 