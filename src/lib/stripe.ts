/**
 * stripe.ts — Stripe integration service for CITALIKS
 *
 * Handles: customer creation, subscription checkout, billing portal,
 * webhook event processing, and subscription status sync.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY         — Stripe secret key (sk_live_... or sk_test_...)
 *   STRIPE_WEBHOOK_SECRET     — Webhook signing secret (whsec_...)
 *   NEXT_PUBLIC_APP_URL       — App base URL for redirect URLs
 *
 * Stripe Products/Prices to create in dashboard:
 *   - Monthly plan   → set STRIPE_PRICE_MONTHLY in env
 *   - Biannual plan  → set STRIPE_PRICE_BIANNUAL in env
 *   - Annual plan    → set STRIPE_PRICE_ANNUAL in env
 */

import Stripe from "stripe";

// Lazy-init to avoid crashing at build time if key is missing
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
    if (!_stripe) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
        _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
    }
    return _stripe;
}

// ── Plan definitions ──────────────────────────────────────────────────────────
export const PLANS: Record<string, { label: string; priceEnvKey: string; months: number; price: number }> = {
    monthly: {
        label: "Plan Mensual",
        priceEnvKey: "STRIPE_PRICE_MONTHLY",
        months: 1,
        price: 0,
    },
    quarterly: {
        label: "Plan Trimestral",
        priceEnvKey: "STRIPE_PRICE_QUARTERLY",
        months: 3,
        price: 0,
    },
    biannual: {
        label: "Plan Semestral",
        priceEnvKey: "STRIPE_PRICE_BIANNUAL",
        months: 6,
        price: 0,
    },
    annual: {
        label: "Plan Anual",
        priceEnvKey: "STRIPE_PRICE_ANNUAL",
        months: 12,
        price: 0,
    },
};

export function getPriceId(plan: string): string {
    const planDef = PLANS[plan];
    if (!planDef) throw new Error(`Unknown plan: ${plan}`);
    const priceId = process.env[planDef.priceEnvKey];
    if (!priceId) throw new Error(`${planDef.priceEnvKey} is not set in environment`);
    return priceId;
}

// ── Customer ──────────────────────────────────────────────────────────────────

/**
 * Create or retrieve a Stripe customer for a CITALIKS client.
 */
export async function getOrCreateStripeCustomer(params: {
    clientId: string;
    email: string;
    businessName: string;
    existingCustomerId?: string | null;
}): Promise<string> {
    const stripe = getStripe();

    if (params.existingCustomerId) {
        // Verify it still exists
        try {
            const customer = await stripe.customers.retrieve(params.existingCustomerId);
            if (!customer.deleted) return params.existingCustomerId;
        } catch {
            // Customer not found, create a new one
        }
    }

    const customer = await stripe.customers.create({
        email: params.email,
        name: params.businessName,
        metadata: { citaliks_client_id: params.clientId },
    });

    return customer.id;
}

// ── Checkout Session ──────────────────────────────────────────────────────────

/**
 * Create a Stripe Checkout Session for a subscription.
 * Returns the session URL to redirect the customer to.
 */
export async function createCheckoutSession(params: {
    customerId?: string;
    customerEmail?: string;
    priceId: string;
    plan: string;
    clientId?: string;
    successUrl: string;
    cancelUrl: string;
    setupPriceId?: string;
    trialDays?: number;
    metadata?: Record<string, string>;
}): Promise<string> {
    const stripe = getStripe();

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        { price: params.priceId, quantity: 1 }
    ];

    if (params.setupPriceId) {
        lineItems.push({ price: params.setupPriceId, quantity: 1 });
    }

    const session = await stripe.checkout.sessions.create({
        customer: params.customerId,
        customer_email: !params.customerId ? params.customerEmail : undefined,
        mode: "subscription",
        line_items: lineItems,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        subscription_data: {
            metadata: {
                ...(params.clientId && { citaliks_client_id: params.clientId }),
                plan: params.plan,
                ...(params.metadata || {}),
            },
            ...(params.trialDays ? { trial_period_days: params.trialDays } : {}),
        },
        metadata: {
            ...(params.clientId && { citaliks_client_id: params.clientId }),
            plan: params.plan,
            ...(params.metadata || {}),
        },
        allow_promotion_codes: true,
        billing_address_collection: "auto",
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return session.url;
}

// ── Billing Portal ────────────────────────────────────────────────────────────

/**
 * Create a Stripe Customer Portal session so the client can manage their billing.
 */
export async function createBillingPortalSession(params: {
    customerId: string;
    returnUrl: string;
}): Promise<string> {
    const stripe = getStripe();

    const session = await stripe.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
    });

    return session.url;
}

// ── Webhook Event Processing ──────────────────────────────────────────────────

/**
 * Verify and parse a Stripe webhook event.
 */
export function constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    return getStripe().webhooks.constructEvent(payload, signature, secret);
}

/**
 * Extract subscription data from a Stripe event for DB sync.
 */
export function extractSubscriptionData(subscription: Stripe.Subscription): {
    stripeSubscriptionId: string;
    stripePriceId: string;
    subscriptionStatus: string;
    subscriptionStart: Date;
    subscriptionEnd: Date;
    trialEnd: Date | null;
    lastPaymentAt: Date | null;
    plan: string;
    clientId: string;
} {
    const priceId = subscription.items.data[0]?.price.id || "";
    const clientId = subscription.metadata?.citaliks_client_id || "";
    const plan = subscription.metadata?.plan || "monthly";

    // Map Stripe status to our internal status
    const statusMap: Record<string, string> = {
        active: "active",
        past_due: "past_due",
        canceled: "canceled",
        unpaid: "past_due",
        incomplete: "inactive",
        incomplete_expired: "canceled",
        trialing: "active",
        paused: "inactive",
    };

    return {
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        subscriptionStatus: statusMap[subscription.status] || "inactive",
        subscriptionStart: new Date(subscription.start_date * 1000),
        subscriptionEnd: new Date((subscription as any).current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        lastPaymentAt: subscription.status === "active" ? new Date() : null,
        plan,
        clientId,
    };
}

// ── Admin helpers ─────────────────────────────────────────────────────────────

/**
 * Cancel a subscription immediately (used by admin when suspending a client).
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
    await getStripe().subscriptions.cancel(subscriptionId);
}

/**
 * Get subscription details from Stripe.
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return getStripe().subscriptions.retrieve(subscriptionId);
}
