import { InvoiceRepository } from "../repositories/invoiceRepository";
import { SubscriptionRepository } from "../repositories/subscriptionRepository";
import { TierRepository } from "../repositories/tierRepository";
import { PaymentService } from "./paymentService";
import { CreditService } from "./creditService";
import { AuditLogRepository } from "../repositories/auditLogRepository";

export interface BillingPlan {
  id: string;
  name: string;
  monthlyQuotaGB: number;
  maxObjects: number;
  priceCents: number;
  currency: string;
  trialDays?: number;
  features: string[];
}

export interface Invoice {
  id: string;
  userId: string;
  amountCents: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "VOID";
  description: string;
  dueAt?: Date;
  paidAt?: Date;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: "ACTIVE" | "PAST_DUE" | "CANCELLED" | "TRIALING" | "EXPIRED" | "PENDING";
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialEndsAt?: Date;
  canceledAt?: Date;
}

export const BillingService = {
  /**
   * Get available billing plans
   * For now, all users get the free plan
   */
  async getAvailablePlans(): Promise<BillingPlan[]> {
    const tiers = await TierRepository.listPublic();
    
    return tiers.map((tier: any) => ({
      id: tier.id,
      name: tier.name,
      monthlyQuotaGB: tier.monthlyQuotaGB,
      maxObjects: tier.maxObjects,
      priceCents: 0, // Free for all users currently
      currency: "usd",
      trialDays: tier.trialDays || 30,
      features: [
        `${tier.monthlyQuotaGB}GB storage`,
        `${tier.maxObjects} objects`,
        "API access",
        "File sharing",
        tier.description || "Basic features",
      ],
    }));
  },

  /**
   * Create a subscription for a user
   * For now, all subscriptions are free and active
   */
  async createSubscription(userId: string, planId: string): Promise<Subscription> {
    // Check if user already has an active subscription
    const existingSubscription = await SubscriptionRepository.findActiveByUserId(userId);
    if (existingSubscription) {
      throw new Error("User already has an active subscription");
    }

    // Create subscription with free tier status
    const subscription = await SubscriptionRepository.create({
      userId,
      tierId: planId,
      status: "ACTIVE", // Free tier is immediately active
      provider: "MANUAL", // Manual/free tier
      paymentMethod: "OTHER",
      startedAt: new Date(),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    // Log the action
    await AuditLogRepository.create({
      userId,
      action: "SUBSCRIPTION_CREATED",
      detail: `Created free subscription for plan ${planId}`,
      metadata: {
        subscriptionId: subscription.id,
        planId,
        status: "ACTIVE",
        timestamp: new Date().toISOString(),
      },
    });

    return {
      id: subscription.id,
      userId: subscription.userId,
      planId: subscription.tierId,
      status: subscription.status as any,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEndsAt: subscription.trialEndsAt,
      canceledAt: subscription.canceledAt,
    };
  },

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    const subscription = await SubscriptionRepository.findActiveByUserId(userId);
    
    if (!subscription) {
      return null;
    }

    return {
      id: subscription.id,
      userId: subscription.userId,
      planId: subscription.tierId,
      status: subscription.status as any,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEndsAt: subscription.trialEndsAt,
      canceledAt: subscription.canceledAt,
    };
  },

  /**
   * Create an invoice
   * For now, all invoices are $0 (free tier)
   */
  async createInvoice(
    userId: string,
    amountCents: number,
    description: string,
    dueAt?: Date
  ): Promise<Invoice> {
    // For free tier, create $0 invoices
    const invoice = await InvoiceRepository.create({
      userId,
      amountCents: 0, // Free tier
      currency: "usd",
      status: "PAID", // Immediately paid for free tier
      provider: "MANUAL",
      description: `Free tier: ${description}`,
      dueAt,
      paidAt: new Date(), // Immediately paid
    });

    // Log the action
    await AuditLogRepository.create({
      userId,
      action: "INVOICE_CREATED",
      detail: `Created free tier invoice: ${description}`,
      metadata: {
        invoiceId: invoice.id,
        amountCents: 0,
        description,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      id: invoice.id,
      userId: invoice.userId,
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      status: invoice.status as any,
      description: invoice.description || description,
      dueAt: invoice.dueAt,
      paidAt: invoice.paidAt,
      createdAt: invoice.createdAt,
    };
  },

  /**
   * Get user's invoices
   */
  async getUserInvoices(userId: string, limit = 50): Promise<Invoice[]> {
    const invoices = await InvoiceRepository.list();
    
    return invoices
      .filter((invoice: any) => invoice.userId === userId)
      .slice(0, limit)
      .map((invoice: any) => ({
        id: invoice.id,
        userId: invoice.userId,
        amountCents: invoice.amountCents,
        currency: invoice.currency,
        status: invoice.status as any,
        description: invoice.description || "",
        dueAt: invoice.dueAt,
        paidAt: invoice.paidAt,
        createdAt: invoice.createdAt,
      }));
  },

  /**
   * Cancel a subscription
   */
  async cancelSubscription(userId: string, subscriptionId: string): Promise<Subscription> {
    const subscription = await SubscriptionRepository.findById(subscriptionId);
    
    if (!subscription || subscription.userId !== userId) {
      throw new Error("Subscription not found or not owned by user");
    }

    // Update subscription status
    const updatedSubscription = await SubscriptionRepository.update(subscriptionId, {
      status: "CANCELLED",
      canceledAt: new Date(),
    });

    // Log the action
    await AuditLogRepository.create({
      userId,
      action: "SUBSCRIPTION_CANCELLED",
      detail: `Cancelled subscription ${subscriptionId}`,
      metadata: {
        subscriptionId,
        canceledAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      },
    });

    return {
      id: updatedSubscription.id,
      userId: updatedSubscription.userId,
      planId: updatedSubscription.tierId,
      status: updatedSubscription.status as any,
      currentPeriodStart: updatedSubscription.currentPeriodStart,
      currentPeriodEnd: updatedSubscription.currentPeriodEnd,
      trialEndsAt: updatedSubscription.trialEndsAt,
      canceledAt: updatedSubscription.canceledAt,
    };
  },

  /**
   * Process subscription payment
   * For now, this is a no-op since all subscriptions are free
   */
  async processSubscriptionPayment(userId: string, subscriptionId: string): Promise<boolean> {
    // Stub implementation - for free tier, always successful
    
    // Log the action
    await AuditLogRepository.create({
      userId,
      action: "SUBSCRIPTION_PAYMENT_PROCESSED",
      detail: `Processed free tier subscription payment for ${subscriptionId}`,
      metadata: {
        subscriptionId,
        amountCents: 0,
        status: "paid",
        timestamp: new Date().toISOString(),
      },
    });

    return true;
  },

  /**
   * Get billing summary for user
   */
  async getBillingSummary(userId: string): Promise<{
    subscription: Subscription | null;
    nextInvoiceAmount: number;
    nextInvoiceDate: Date | null;
    paymentMethodsCount: number;
    creditsBalance: number;
  }> {
    const subscription = await this.getUserSubscription(userId);
    const paymentMethods = await PaymentService.getPaymentMethods(userId);
    const credits = await CreditService.getBalance(userId);

    return {
      subscription,
      nextInvoiceAmount: 0, // Free tier
      nextInvoiceDate: subscription?.currentPeriodEnd || null,
      paymentMethodsCount: paymentMethods.length,
      creditsBalance: credits.totalCreditsUSD,
    };
  },
};