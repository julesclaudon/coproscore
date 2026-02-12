import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, resetPasswordEmail } from "@/lib/mail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email } = body;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase();

  // Always return same response to avoid email enumeration
  const genericResponse = NextResponse.json({ ok: true });

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) return genericResponse;

  // Delete any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  // Generate token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  const resetUrl = `https://coproscore.fr/reset-password?token=${rawToken}`;

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: "Réinitialisez votre mot de passe CoproScore",
      html: resetPasswordEmail(resetUrl),
    });
  } catch (err) {
    console.error("Failed to send password reset email:", err);
  }

  return genericResponse;
}
