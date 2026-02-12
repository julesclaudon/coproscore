import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail, welcomeEmail } from "@/lib/mail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password } = body;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 8 caractères" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      role: "FREE",
    },
  });

  // Fire-and-forget welcome email
  sendEmail({
    to: normalizedEmail,
    subject: "Bienvenue sur CoproScore",
    html: welcomeEmail(),
  }).catch((err) => {
    console.error("Failed to send welcome email:", err);
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
