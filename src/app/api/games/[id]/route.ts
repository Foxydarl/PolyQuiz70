import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
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
        questions: true,
        creator: true,
      },
    });

    if (!game) {
      return NextResponse.json(
        { error: "Игра не найдена" },
        { status: 404 }
      );
    }

    if (game.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Нет доступа к этой игре" },
        { status: 403 }
      );
    }

    return NextResponse.json({ game });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка при получении игры" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Не авторизован" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, questions } = body;

    const game = await prisma.game.findUnique({
      where: {
        id: params.id,
      },
      include: {
        creator: true,
      },
    });

    if (!game) {
      return NextResponse.json(
        { error: "Игра не найдена" },
        { status: 404 }
      );
    }

    if (game.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Нет доступа к этой игре" },
        { status: 403 }
      );
    }

    // Удаляем старые вопросы
    await prisma.question.deleteMany({
      where: {
        gameId: params.id,
      },
    });

    // Создаем новые вопросы
    const updatedGame = await prisma.game.update({
      where: {
        id: params.id,
      },
      data: {
        title,
        description,
        questions: {
          create: questions.map((q: any) => ({
            text: q.text,
            options: q.options,
            correct: q.correct,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json({ game: updatedGame });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка при обновлении игры" },
      { status: 500 }
    );
  }
} 