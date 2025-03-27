import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
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
        code: params.code,
      },
      include: {
        questions: true,
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

    // Добавляем пользователя к участникам игры
    await prisma.game.update({
      where: {
        id: game.id,
      },
      data: {
        participants: {
          connect: {
            id: session.user.id,
          },
        },
      },
    });

    return NextResponse.json({ game });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка при подключении к игре" },
      { status: 500 }
    );
  }
} 