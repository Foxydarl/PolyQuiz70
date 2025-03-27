import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]/route";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

export async function POST(request: Request) {
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

    const game = await prisma.game.create({
      data: {
        title,
        description,
        code: nanoid(6).toUpperCase(),
        creatorId: session.user.id,
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

    return NextResponse.json({ game });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка при создании игры" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Не авторизован" },
        { status: 401 }
      );
    }

    const games = await prisma.game.findMany({
      where: {
        creatorId: session.user.id,
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json({ games });
  } catch (error) {
    return NextResponse.json(
      { error: "Ошибка при получении игр" },
      { status: 500 }
    );
  }
} 