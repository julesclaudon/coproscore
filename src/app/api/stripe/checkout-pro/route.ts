import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/stripe-helpers";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Check if already PRO
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user.role === "PRO" || user.role === "ADMIN") {
    return NextResponse.json({ error: "Déjà abonné Pro" }, { status: 409 });
  }

  const customerId = await getOrCreateStripeCustomer(session.user.id);

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_PRO!,
        quantity: 1,
      },
    ],
    metadata: {
      userId: session.user.id,
      type: "pro",
    },
    subscription_data: {
      metadata: {
        userId: session.user.id,
      },
    },
    success_url: `${process.env.NEXTAUTH_URL}/tarifs?pro=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/tarifs`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
