import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  let body: { token?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token, password } = body;

  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 8 caractères" },
      { status: 400 }
    );
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: hashedToken },
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Lien invalide ou expiré" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.delete({
    where: { id: resetToken.id },
  });

  return NextResponse.json({ ok: true });
}
