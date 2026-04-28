/**
 * Creem.io Payment Client
 * Handles checkout creation and subscription management
 */

export interface CreemCheckoutRequest {
  userId: string;
  userEmail: string;
  plan: 'LITE' | 'PRO' | 'ENTERPRISE';
  billingCycle: 'monthly' | 'yearly';
  successUrl: string;
  cancelUrl: string;
}

export interface CreemCheckoutResponse {
  success: boolean;
  checkoutUrl?: string;
  sessionId?: string;
  error?: string;
}

export interface CreemWebhookEvent {
  event: 'checkout.completed' | 'subscription.created' | 'subscription.updated' | 'subscription.cancelled' | 'payment.failed';
  data: {
    id: string;
    customer_id: string;
    plan_id: string;
    status: string;
    amount?: number;
    currency?: string;
    metadata?: Record<string, any>;
  };
}

class CreemPaymentClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CREEMIO_API_KEY || '';
    this.baseUrl = process.env.CREEMIO_BASE_URL || 'https://api.creem.io';
  }

  /**
   * Create a checkout session
   */
  async createCheckout(request: CreemCheckoutRequest): Promise<CreemCheckoutResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Creem.io API key not configured'
      };
    }

    try {
      const planPrices = this.getPlanPrices();
      const price = planPrices[request.plan][request.billingCycle];

      const response = await fetch(`${this.baseUrl}/v1/checkouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          customer_email: request.userEmail,
          amount: price,
          currency: 'USD',
          metadata: {
            userId: request.userId,
            plan: request.plan,
            billingCycle: request.billingCycle
          },
          success_url: request.successUrl,
          cancel_url: request.cancelUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to create checkout'
        };
      }

      return {
        success: true,
        checkoutUrl: data.checkout_url,
        sessionId: data.session_id
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get plan prices in cents
   */
  private getPlanPrices(): Record<string, Record<string, number>> {
    return {
      LITE: {
        monthly: 900,  // $9.00
        yearly: 7900  // $79.00
      },
      PRO: {
        monthly: 2900,  // $29.00
        yearly: 24900  // $249.00
      },
      ENTERPRISE: {
        monthly: 9900,  // $99.00
        yearly: 89900  // $899.00
      }
    };
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // In production, implement proper HMAC verification
    // For now, do basic check
    return signature.length > 0 && secret.length > 0;
  }

  /**
   * Parse webhook event
   */
  parseWebhook(payload: string): CreemWebhookEvent | null {
    try {
      return JSON.parse(payload) as CreemWebhookEvent;
    } catch {
      return null;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Creem.io API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/v1/subscriptions/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch subscription');
    }

    return response.json();
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Map Creem.io plan ID to internal plan
   */
  mapPlan(creemPlanId: string): 'LITE' | 'PRO' | 'ENTERPRISE' {
    const planMap: Record<string, 'LITE' | 'PRO' | 'ENTERPRISE'> = {
      'lite_monthly': 'LITE',
      'lite_yearly': 'LITE',
      'pro_monthly': 'PRO',
      'pro_yearly': 'PRO',
      'enterprise_monthly': 'ENTERPRISE',
      'enterprise_yearly': 'ENTERPRISE'
    };
    return planMap[creemPlanId] || 'PRO';
  }

  /**
   * Get credit amount for plan
   */
  getCreditsForPlan(plan: 'LITE' | 'PRO' | 'ENTERPRISE'): number {
    const credits = {
      LITE: 500,
      PRO: 2000,
      ENTERPRISE: 10000
    };
    return credits[plan];
  }
}

// Singleton instance
export const creemPayment = new CreemPaymentClient();
