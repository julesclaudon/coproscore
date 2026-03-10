import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, onboardingEmail } from "@/lib/mail";

const DELAY_MS = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - DELAY_MS);

  const users = await prisma.user.findMany({
    where: {
      createdAt: { lte: cutoff },
      onboardingEmailSentAt: null,
      email: { not: null },
    },
    select: { id: true, email: true, name: true },
    take: 50,
  });

  let sent = 0;
  for (const user of users) {
    try {
      await sendEmail({
        to: user.email!,
        subject: "Bienvenue sur CoproScore 🏠",
        html: onboardingEmail(user.name),
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { onboardingEmailSentAt: new Date() },
      });
      sent++;
    } catch (err) {
      console.error(`[onboarding-email] Failed for ${user.id}:`, err);
    }
  }

  return NextResponse.json({ sent, total: users.length });
}
