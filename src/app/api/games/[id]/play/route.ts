import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Не авторизован" },
        { status: 401 }
      );
    }

    const game = await prisma.game.findUnique({
      where: {
        id: params.id,
      },
      include: {
        questions: {
          select: {
            id: true,
            text: true,
            options: true,
            correct: true,
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json(
        { error: "Игра не найдена" },
        { status: 404 }
      );
    }

    if (!game.isActive) {
      return NextResponse.json(
        { error: "Игра не активна" },
        { status: 400 }
      );
    }

    // Проверяем, является ли пользователь участником игры
    const isParticipant = await prisma.gameParticipant.findFirst({
      where: {
        gameId: game.id,
        userId: session.user.id,
      },
    });

    if (!isParticipant) {
      return NextResponse.json(
        { error: "Вы не являетесь участником этой игры" },
        { status: 403 }
      );
    }

    return NextResponse.json({ game });
  } catch (error) {
    console.error("Ошибка при получении игры:", error);
    return NextResponse.json(
      { error: "Ошибка при получении игры" },
      { status: 500 }
    );
  }
} 