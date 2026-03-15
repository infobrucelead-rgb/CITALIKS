export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  setupFee: number;
  commitmentMonths: number;
  popular?: boolean;
  stripePriceId: string | undefined; // ID recurrente en Stripe (activo)
  stripeSetupId: string | undefined; // ID de pago único en Stripe (activo)
}

/**
 * Price IDs de Stripe — hardcodeados para garantizar estabilidad en producción.
 * Última actualización: Marzo 2026.
 *
 * BASIC  (Anual)       → prod gratis, recurrente: price_1T5Agm5J4yndzjFUaCNw1zuo
 * BUSINESS (Semestral) → setup: price_1SqeUh5J4yndzjFUjqSTq5qk | recurrente: price_1TAuqj5J4yndzjFUKdX9Haqy
 * PREMIUM (Trimestral) → setup: price_1TAvBQ5J4yndzjFUo5HGjRJ7 | recurrente: price_1TAvCC5J4yndzjFUrbkptkaa
 */
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "basic",
    name: "Basic (Anual)",
    description: "La opción más inteligente. Ahorro máximo y estabilización de agenda.",
    priceMonthly: 99,
    setupFee: 0,
    commitmentMonths: 12,
    popular: true,
    stripePriceId: "price_1T5Agm5J4yndzjFUaCNw1zuo",
    stripeSetupId: undefined, // Matrícula gratis
  },
  {
    id: "business",
    name: "Business (Semestral)",
    description: "Crecimiento constante con implementaciones intermedias.",
    priceMonthly: 109,
    setupFee: 99,
    commitmentMonths: 6,
    stripePriceId: "price_1TAuqj5J4yndzjFUKdX9Haqy",
    stripeSetupId: "price_1SqeUh5J4yndzjFUjqSTq5qk",
  },
  {
    id: "premium",
    name: "Premium (Trimestral)",
    description: "Máxima flexibilidad sin compromisos a largo plazo.",
    priceMonthly: 129,
    setupFee: 149,
    commitmentMonths: 3,
    stripePriceId: "price_1TAvCC5J4yndzjFUrbkptkaa",
    stripeSetupId: "price_1TAvBQ5J4yndzjFUo5HGjRJ7",
  }
];

export function getPlanById(id: string): PricingPlan | undefined {
  return PRICING_PLANS.find(p => p.id === id);
}

/**
 * Genera el listado en formato texto para inyectarlo en el System Prompt del Chatbot.
 */
export function getPricingPromptText(): string {
  return PRICING_PLANS.map(p => {
    let text = `- **${p.name}** (${p.commitmentMonths} meses de compromiso): Suscripción de ${p.priceMonthly}€/mes.`;
    if (p.setupFee > 0) {
      text += ` Coste de instalación (Matrícula): Pago único de ${p.setupFee}€.`;
    } else {
      text += ` ¡INSTALACIÓN GRATIS! (Ahorras la matrícula).`;
    }
    return text;
  }).join("\n");
}
