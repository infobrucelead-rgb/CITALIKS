export interface PricingPlan {
  id: string; // ID interno (basic, business, premium)
  name: string; // Nombre comercial
  description: string; // Breve descripción para la UI
  priceMonthly: number; // Cuota mensual recurrente 
  setupFee: number; // Pago único de instalación/matrícula
  commitmentMonths: number; // Meses de permanencia
  popular?: boolean; // Para destacar en UI
  stripePriceId: string | undefined; // ID recurrente en Stripe
  stripeSetupId: string | undefined; // ID de pago único en Stripe
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "basic",
    name: "Basic (Anual)",
    description: "La opción más inteligente. Ahorro máximo y estabilización de agenda.",
    priceMonthly: 99,
    setupFee: 0, // Matrícula gratis como señuelo
    commitmentMonths: 12,
    popular: true,
    stripePriceId: process.env.STRIPE_PRICE_BASIC_12M,
    stripeSetupId: process.env.STRIPE_PRICE_SETUP_BASIC, 
  },
  {
    id: "business",
    name: "Business (Semestral)",
    description: "Crecimiento constante con implementaciones intermedias.",
    priceMonthly: 109,
    setupFee: 99,
    commitmentMonths: 6,
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS_6M,
    stripeSetupId: process.env.STRIPE_PRICE_SETUP_BUSINESS,
  },
  {
    id: "premium",
    name: "Premium (Trimestral)",
    description: "Máxima flexibilidad sin compromisos a largo plazo.",
    priceMonthly: 129,
    setupFee: 149,
    commitmentMonths: 3,
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM_3M,
    stripeSetupId: process.env.STRIPE_PRICE_SETUP_PREMIUM,
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
