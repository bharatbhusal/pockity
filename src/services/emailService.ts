import nodemailer from "nodemailer";
import { env } from "../config/env";
import { send } from "process";

const generateEmailHtml = (subject: string, text: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2 style="color: #333;">${subject}</h2>
      <p>${text}</p>
      <footer style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc;">
        <p>Best regards,</p>
        <p>Pockity - Storage as a Service</p>
        <p><a href="mailto:superadmin@bharatbhusal.com">superadmin@bharatbhusal.com</a></p>
      </footer>
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

  async sendKeyPairEmail(to: string, apiAccessKeyId: string, secretKey: string): Promise<void> {
    const subject = "Your API Key Pair - Pockity";
    const text = `Your API Access Key ID is: ${apiAccessKeyId}\nYour Secret Key is: ${secretKey}\n\nPlease keep these keys safe and do not share them with anyone. This is the only time you will see these keys.`;

    await this.sendEmail(to, subject, text);
  },
};
