import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/stripe-helpers";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { slug } = await request.json();
  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "Slug manquant" }, { status: 400 });
  }

  // Verify copro exists
  const copro = await prisma.copropriete.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!copro) {
    return NextResponse.json({ error: "Copropriété introuvable" }, { status: 404 });
  }

  // Check if already purchased
  const existing = await prisma.pdfPurchase.findUnique({
    where: { userId_slug: { userId: session.user.id, slug } },
  });
  if (existing) {
    return NextResponse.json({ error: "Rapport déjà acheté" }, { status: 409 });
  }

  const customerId = await getOrCreateStripeCustomer(session.user.id);

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_PDF!,
        quantity: 1,
      },
    ],
    metadata: {
      userId: session.user.id,
      slug,
      type: "pdf",
    },
    success_url: `${process.env.NEXTAUTH_URL}/copropriete/${slug}?pdf=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/copropriete/${slug}`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
