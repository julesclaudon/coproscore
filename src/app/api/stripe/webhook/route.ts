import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

/** Get the current_period_end from the first subscription item */
function getPeriodEnd(subscription: Stripe.Subscription): Date {
  const item = subscription.items.data[0];
  return new Date(item.current_period_end * 1000);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[stripe webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const type = session.metadata?.type;
      const userId = session.metadata?.userId;

      if (type === "pdf" && userId) {
        const slug = session.metadata?.slug;
        if (slug) {
          // Idempotent: unique on stripeSessionId
          await prisma.pdfPurchase.upsert({
            where: { stripeSessionId: session.id },
            create: {
              userId,
              slug,
              stripeSessionId: session.id,
              amount: session.amount_total ?? 490,
            },
            update: {},
          });
        }
      }

      if (type === "pro" && userId) {
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await prisma.user.update({
          where: { id: userId },
          data: {
            role: "PRO",
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0]?.price.id,
            stripeCurrentPeriodEnd: getPeriodEnd(subscription),
          },
        });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subRef = invoice.parent?.subscription_details?.subscription;
      const subscriptionId = typeof subRef === "string" ? subRef : subRef?.id;
      if (!subscriptionId) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata?.userId;
      if (!userId) break;

      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeCurrentPeriodEnd: getPeriodEnd(subscription),
        },
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) break;

      // Keep PRO for active and past_due
      if (subscription.status === "active" || subscription.status === "past_due") {
        await prisma.user.update({
          where: { id: userId },
          data: {
            role: "PRO",
            stripePriceId: subscription.items.data[0]?.price.id,
            stripeCurrentPeriodEnd: getPeriodEnd(subscription),
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) break;

      await prisma.user.update({
        where: { id: userId },
        data: {
          role: "FREE",
          stripeSubscriptionId: null,
          stripePriceId: null,
          stripeCurrentPeriodEnd: null,
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
