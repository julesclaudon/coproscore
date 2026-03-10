import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, abandonedCartEmail } from "@/lib/mail";

const DELAY_MS = 30 * 60 * 1000; // 30 minutes
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // Don't email intents older than 24h

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - DELAY_MS);
  const maxAge = new Date(Date.now() - MAX_AGE_MS);

  const intents = await prisma.pdfCheckoutIntent.findMany({
    where: {
      completed: false,
      emailSent: false,
      createdAt: { lte: cutoff, gte: maxAge },
    },
    include: {
      user: { select: { email: true } },
    },
    take: 50,
  });

  // Deduplicate: one email per user+slug (keep most recent)
  const seen = new Set<string>();
  const unique = intents.filter((i) => {
    const key = `${i.userId}:${i.slug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let sent = 0;
  for (const intent of unique) {
    // Skip if user already purchased this PDF
    const purchased = await prisma.pdfPurchase.findUnique({
      where: { userId_slug: { userId: intent.userId, slug: intent.slug } },
    });
    if (purchased) {
      // Mark all intents for this user+slug as completed
      await prisma.pdfCheckoutIntent.updateMany({
        where: { userId: intent.userId, slug: intent.slug },
        data: { completed: true },
      });
      continue;
    }

    const email = intent.user.email;
    if (!email) continue;

    try {
      const copro = await prisma.copropriete.findUnique({
        where: { slug: intent.slug },
        select: { adresseReference: true, communeAdresse: true },
      });
      const adresse = copro
        ? [copro.adresseReference, copro.communeAdresse].filter(Boolean).join(", ")
        : intent.slug;

      await sendEmail({
        to: email,
        subject: "Votre rapport CoproScore vous attend 🏠",
        html: abandonedCartEmail(adresse, intent.slug),
      });

      // Mark all intents for this user+slug as emailSent
      await prisma.pdfCheckoutIntent.updateMany({
        where: { userId: intent.userId, slug: intent.slug },
        data: { emailSent: true },
      });
      sent++;
    } catch (err) {
      console.error(`[abandoned-cart] Failed for intent ${intent.id}:`, err);
    }
  }

  return NextResponse.json({ sent, checked: unique.length });
}
