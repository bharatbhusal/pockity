import { OtpRepository } from "../repositories/otpRepository";
import { EmailService } from "./emailService";
import { PockityErrorBadRequest, PockityErrorNotFound } from "../utils/response/PockityErrorClasses";
import { OtpPurpose } from "@prisma/client";

export const OtpService = {
  generateOtp(): string {
    // Generate 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  getOtpExpiry(): Date {
    // OTP expires in 10 minutes
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);
    return expiry;
  },

  async sendOtp(email: string, purpose: string): Promise<void> {
    const otp = this.generateOtp();
    const expiry = this.getOtpExpiry();

    // Upsert OTP (create or update existing)
    await OtpRepository.upsertByEmail(email, {
      otp_code: otp,
      purpose,
      expiry,
    });

    // Send OTP email
    await EmailService.sendOtpEmail(email, otp, purpose);
  },

  async verifyOtp(email: string, otpCode: string, purpose: OtpPurpose): Promise<boolean> {
    const otpRecord = await OtpRepository.findByEmailAndPurpose(email, purpose);

    if (!otpRecord) {
      throw new PockityErrorNotFound({
        message: "OTP not found. Please request a new OTP.",
        httpStatusCode: 404,
      });
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiry) {
      throw new PockityErrorBadRequest({
        message: "OTP has expired. Please request a new OTP.",
        httpStatusCode: 400,
      });
    }

    // Check if OTP matches
    if (otpRecord.otp_code !== otpCode) {
      throw new PockityErrorBadRequest({
        message: "Invalid OTP. Please check and try again.",
        httpStatusCode: 400,
      });
    }

    // OTP is valid, delete it after verification
    await OtpRepository.delete(otpRecord.id);

    return true;
  },

  async deleteOtp(email: string, purpose: OtpPurpose): Promise<void> {
    const otpRecord = await OtpRepository.findByEmailAndPurpose(email, purpose);
    if (otpRecord) {
      await OtpRepository.delete(otpRecord.id);
    }
  },
};
