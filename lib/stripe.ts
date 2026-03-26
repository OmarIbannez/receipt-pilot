import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import type { Plan } from "@/types";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia",
});

const PRICE_TO_PLAN: Record<string, Plan> = {
  [process.env.STRIPE_PRO_PRICE_ID ?? ""]: "PRO",
  [process.env.STRIPE_BUSINESS_PRICE_ID ?? ""]: "BUSINESS",
};

export async function createCheckoutSession(
  userId: string,
  priceId: string
): Promise<Stripe.Checkout.Session> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: { userId },
  });

  return session;
}

export async function createPortalSession(
  customerId: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return session;
}

export async function handleWebhookEvent(
  event: Stripe.Event
): Promise<{ received: boolean }> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) break;

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      const priceId = subscription.items.data[0]?.price?.id;
      const plan = priceId ? PRICE_TO_PLAN[priceId] ?? "PRO" : "PRO";

      await prisma.user.update({
        where: { id: userId },
        data: { plan },
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price?.id;
      const plan = priceId ? PRICE_TO_PLAN[priceId] ?? "PRO" : "PRO";

      const customer = await stripe.customers.retrieve(
        subscription.customer as string
      );
      if (customer.deleted) break;

      await prisma.user.updateMany({
        where: { email: customer.email ?? "" },
        data: { plan },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customer = await stripe.customers.retrieve(
        subscription.customer as string
      );
      if (customer.deleted) break;

      await prisma.user.updateMany({
        where: { email: customer.email ?? "" },
        data: { plan: "FREE" },
      });
      break;
    }
  }

  return { received: true };
}
