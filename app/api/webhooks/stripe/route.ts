import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import type { Plan } from "@/app/generated/prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const PRICE_TO_PLAN: Record<string, Plan> = {
  [process.env.STRIPE_PRO_PRICE_ID ?? ""]: "PRO",
  [process.env.STRIPE_BUSINESS_PRICE_ID ?? ""]: "BUSINESS",
};

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_email ?? session.customer_details?.email;
        const subscriptionId = session.subscription as string | null;

        if (!customerEmail) {
          console.error("No customer email in checkout session");
          break;
        }

        // Determine plan from line items
        let plan: Plan = "PRO";
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price?.id;
          if (priceId && PRICE_TO_PLAN[priceId]) {
            plan = PRICE_TO_PLAN[priceId];
          }
        }

        await prisma.user.updateMany({
          where: { email: customerEmail },
          data: { plan },
        });

        console.log(`Upgraded ${customerEmail} to ${plan}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get customer email from Stripe
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted || !customer.email) {
          console.error("Customer not found or deleted:", customerId);
          break;
        }

        await prisma.user.updateMany({
          where: { email: customer.email },
          data: { plan: "FREE" },
        });

        console.log(`Downgraded ${customer.email} to FREE`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
