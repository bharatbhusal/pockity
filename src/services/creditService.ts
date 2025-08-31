import { CreditRepository } from "../repositories/creditRepository";
import { AuditLogRepository } from "../repositories/auditLogRepository";

export interface CreditBalance {
  totalCreditsUSD: number;
  currency: string;
}

export interface CreditTransaction {
  id: string;
  amountCents: number;
  currency: string;
  source: string;
  createdAt: Date;
}

export const CreditService = {
  /**
   * Get user's current credit balance
   * For now, all users get unlimited credits (free tier)
   */
  async getBalance(userId: string): Promise<CreditBalance> {
    // Stub implementation - for now, all users have unlimited credits
    return {
      totalCreditsUSD: 999999, // Effectively unlimited for free tier
      currency: "usd",
    };
  },

  /**
   * Add credits to user account
   * This is a stub for future payment integration
   */
  async addCredits(userId: string, amountCents: number, source: string, metadata?: any): Promise<CreditTransaction> {
    // Create credit record in database
    const credit = await CreditRepository.create({
      userId,
      amountCents,
      currency: "usd",
      source,
      metadata,
    });

    // Log the action
    await AuditLogRepository.create({
      userId,
      action: "CREDIT_ADD",
      detail: `Added ${amountCents / 100} USD credits from ${source}`,
      metadata: {
        amountCents,
        source,
        creditId: credit.id,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      id: credit.id,
      amountCents: credit.amountCents,
      currency: credit.currency,
      source: credit.source || source,
      createdAt: credit.createdAt,
    };
  },

  /**
   * Deduct credits from user account
   * For now, this is a no-op since all users have unlimited credits
   */
  async deductCredits(userId: string, amountCents: number, reason: string): Promise<boolean> {
    // Stub implementation - for now, always return true (unlimited credits)
    
    // Log the action for audit purposes
    await AuditLogRepository.create({
      userId,
      action: "CREDIT_DEDUCT",
      detail: `Deducted ${amountCents / 100} USD credits for ${reason}`,
      metadata: {
        amountCents,
        reason,
        timestamp: new Date().toISOString(),
      },
    });

    return true; // Always successful in free tier
  },

  /**
   * Get credit transaction history
   */
  async getTransactionHistory(userId: string, limit = 50): Promise<CreditTransaction[]> {
    const credits = await CreditRepository.list();
    
    return credits
      .filter((credit: any) => credit.userId === userId)
      .slice(0, limit)
      .map((credit: any) => ({
        id: credit.id,
        amountCents: credit.amountCents,
        currency: credit.currency,
        source: credit.source || "unknown",
        createdAt: credit.createdAt,
      }));
  },

  /**
   * Check if user has sufficient credits
   * For now, always returns true (free tier)
   */
  async hasSufficientCredits(userId: string, requiredAmountCents: number): Promise<boolean> {
    // Stub implementation - for now, all users have unlimited credits
    return true;
  },
};