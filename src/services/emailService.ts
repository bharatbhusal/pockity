import nodemailer from "nodemailer";
import { env } from "../config/env";
import { send } from "process";

const generateEmailHtml = (subject: string, text: string): string => {
  return `
    <div style="background: #f4f6fb; padding: 40px 0; min-height: 100vh;">
      <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); padding: 32px 28px;">
        <div style="text-align: center;">
          <h2 style="color: #1a237e; margin-bottom: 8px; font-size: 1.7em; letter-spacing: 0.5px;">${subject}</h2>
        </div>
        <div style="color: #333; font-size: 1.08em; margin: 24px 0 32px 0; line-height: 1.7;">
          ${text.replace(/\n/g, "<br>")}
        </div>
        <footer style="border-top: 1px solid #e3e8f0; padding-top: 18px; text-align: center; color: #888;">
          <p style="margin: 0 0 4px 0;">Best regards,</p>
          <p style="margin: 0 0 4px 0; font-weight: 500; color: #1a237e;">Pockity – Storage as a Service</p>
          <a href="mailto:superadmin@bharatbhusal.com" style="display: inline-block; margin-top: 8px; color: #fff; background: #1a237e; padding: 8px 18px; border-radius: 6px; text-decoration: none; font-size: 0.98em;">Contact Support</a>
          <div style="margin-top: 18px; font-size: 0.92em; color: #b0b0b0;">&copy; ${new Date().getFullYear()} Pockity</div>
        </footer>
      </div>
    </div>
  `;
};

export const EmailService = {
  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT),
      secure: env.SMTP_PORT === "465",
      auth: {
        user: env.SMTP_MAIL_ID,
        pass: env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: env.SMTP_MAIL_ID,
      to,
      subject,
      text,
      html: generateEmailHtml(subject, text),
    };

    await transporter.sendMail(mailOptions);
  },

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const subject = "Email Verification - Pockity";
    const text = `Your email verification OTP is: ${otp}. This OTP will expire in 10 minutes.`;

    await this.sendEmail(to, subject, text);
  },

  async sendApiCreateRequestStatus(to: string, apiAccessKeyId: string, secretKey: string): Promise<void> {
    const subject = "Your API Key Pair - Pockity";
    const text = `Your API Access Key ID is: ${apiAccessKeyId}
    Your Secret Key is: ${secretKey}
    
    Please keep these keys safe and do not share them with anyone. This is the only time you will see these keys.`;

    await this.sendEmail(to, subject, text);
  },

  async sendApiUpgradeRequestStatus(
    to: string,
    apiAccessKeyId: string,
    status: "approved" | "rejected",
  ): Promise<void> {
    const subject = `API Upgrade Request ${status === "approved" ? "Approved" : "Rejected"} - Pockity`;
    const text = `Your API Upgrade Request for API Access Key ID: ${apiAccessKeyId} has been ${status}.`;

    await this.sendEmail(to, subject, text);
  },
};
