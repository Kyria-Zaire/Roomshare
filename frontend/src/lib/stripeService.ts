import apiClient from "@/lib/apiClient";

export type PlanType = "pass_day" | "pass_week" | "pass_month" | "pro_sub";

/**
 * Crée une session Stripe Checkout et redirige l'utilisateur vers la page de paiement.
 * @param planType - pass_day | pass_week | pass_month | pro_sub
 * @returns URL de redirection ou null en cas d'erreur
 */
export async function createCheckoutSession(planType: PlanType): Promise<string | null> {
  const { data } = await apiClient.post<{ success: boolean; url?: string; message?: string }>(
    "/stripe/checkout",
    { plan_type: planType }
  );
  if (data.success && data.url) {
    return data.url;
  }
  return null;
}
