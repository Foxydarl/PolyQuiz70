import { GAME_STATE_INIT } from "../../config.mjs"
import { abortCooldown, cooldown, sleep } from "../utils/cooldown.js"
import deepClone from "../utils/deepClone.js"
import generateRoomId from "../utils/generateRoomId.js"
import { startRound } from "../utils/round.js"

const Manager = {
  createRoom: (game, io, socket, password) => {
    if (game.password !== password) {
      io.to(socket.id).emit("game:errorMessage", "Bad Password")
      return
    }

    if (game.manager || game.room) {
      io.to(socket.id).emit("game:errorMessage", "Already manager")
      return
    }

    let roomInvite = generateRoomId()
    game.room = roomInvite
    game.manager = socket.id

    socket.join(roomInvite)
    io.to(socket.id).emit("manager:inviteCode", roomInvite)

    console.log("New room created: " + roomInvite)
  },

  kickPlayer: (game, io, socket, playerId) => {
    if (game.manager !== socket.id) {
      return
    }

    const player = game.players.find((p) => p.id === playerId)
    game.players = game.players.filter((p) => p.id !== playerId)

    io.in(playerId).socketsLeave(game.room)
    io.to(player.id).emit("game:kick")
    io.to(game.manager).emit("manager:playerKicked", player.id)
  },

  startGame: async (game, io, socket) => {
    if (game.started || !game.room) {
      return
    }

    game.started = true
    io.to(game.room).emit("game:status", {
      name: "SHOW_START",
      data: {
        time: 3,
        subject: game.subject,
      },
    })

    await sleep(3)
    io.to(game.room).emit("game:startCooldown")

    await cooldown(3, io, game.room)
    startRound(game, io, socket)
  },

  nextQuestion: (function() {
    // Переменные для дебаунса внутри замыкания
    let lastQuestionChangeTime = 0;
    const DEBOUNCE_TIME = 1000; // 1 секунда дебаунса
    
    return function(game, io, socket) {
      if (!game.started) {
        return
      }

      if (socket.id !== game.manager) {
        return
      }

      if (!game.questions[game.currentQuestion + 1]) {
        return
      }

      // Проверка времени последнего вызова для предотвращения двойных кликов
      const now = Date.now();
      if (now - lastQuestionChangeTime < DEBOUNCE_TIME) {
        console.log("nextQuestion вызван слишком быстро, игнорируем");
        return;
      }
      
      lastQuestionChangeTime = now;
      
      // Переходим к следующему вопросу
      game.currentQuestion++
      startRound(game, io, socket)
    }
  })(),

  abortQuiz: (game, io, socket) => {
    if (!game.started) {
      return
    }

    if (socket.id !== game.manager) {
      return
    }

    abortCooldown(game, io, game.room)
  },

  showLeaderboard: (game, io, socket) => {
    if (!game.questions[game.currentQuestion + 1]) {
      socket.emit("game:status", {
        name: "FINISH",
        data: {
          subject: game.subject,
          top: game.players
            .sort((a, b) => {
              if ((b.correctAnswers || 0) !== (a.correctAnswers || 0)) {
                return (b.correctAnswers || 0) - (a.correctAnswers || 0)
              }
              return b.points - a.points
            })
            .slice(0, 3),
          totalQuestions: game.questions.length,
        },
      })

      game = deepClone(GAME_STATE_INIT)
      return
    }

    socket.emit("game:status", {
      name: "SHOW_LEADERBOARD",
      data: {
        leaderboard: game.players
          .sort((a, b) => {
            if ((b.correctAnswers || 0) !== (a.correctAnswers || 0)) {
              return (b.correctAnswers || 0) - (a.correctAnswers || 0)
            }
            return b.points - a.points
          }),
        totalQuestions: game.questions.length,
        isFinal: false
      },
    })
  },

  showFullLeaderboard: (game, io, socket) => {
    if (socket.id !== game.manager) {
      console.log("Отклонена попытка показать полный лидерборд: не менеджер");
      return;
    }

    console.log("Показываю полный лидерборд");
    socket.emit("game:status", {
      name: "SHOW_FULL_LEADERBOARD",
      data: {
        leaderboard: game.players.sort((a, b) => {
          if ((b.correctAnswers || 0) !== (a.correctAnswers || 0)) {
            return (b.correctAnswers || 0) - (a.correctAnswers || 0)
          }
          return b.points - a.points
        }),
        totalQuestions: game.questions.length,
      },
    })
  },

  showUserStats: (game, io, socket, userId) => {
    if (socket.id !== game.manager) {
      console.log("Отклонена попытка показать статистику пользователя: не менеджер");
      return;
    }

    const user = game.players.find(player => player.id === userId);
    
    if (!user) {
      console.log("Пользователь не найден:", userId);
      return;
    }

    console.log("Показываю статистику пользователя:", user.username);
    socket.emit("game:status", {
      name: "SHOW_USER_STATS",
      data: {
        user,
        questions: game.questions,
        totalQuestions: game.questions.length,
      },
    })
  },

  showPodium: (game, io, socket) => {
    if (socket.id !== game.manager) {
      console.log("Отклонена попытка показать подиум: не менеджер");
      return;
    }

    console.log("Показываю подиум");
    socket.emit("game:status", {
      name: "FINISH",
      data: {
        subject: game.subject,
        top: game.players
          .sort((a, b) => {
            if ((b.correctAnswers || 0) !== (a.correctAnswers || 0)) {
              return (b.correctAnswers || 0) - (a.correctAnswers || 0)
            }
            return b.points - a.points
          })
          .slice(0, 3),
        totalQuestions: game.questions.length,
      },
    })
  },
}

export default Manager
