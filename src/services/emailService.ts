import nodemailer from "nodemailer";
import { env } from "../config/env";

const generateEmailHtml = (subject: string, text: string): string => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${subject}</title>
    <style>
      @media only screen and (max-width: 600px) {
        .container {
          padding: 16px !important;
        }
        .main-content {
          font-size: 1em !important;
        }
        .footer {
          font-size: 0.95em !important;
        }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#f6f8fa;">
    <div class="container" style="max-width: 520px; margin: 32px auto; background: #fff; border-radius: 10px; box-shadow: 0 2px 12px rgba(30,40,90,0.07); padding: 40px;">
      <div style="text-align: center;">
        <h2 style="color: #1a237e; margin-bottom: 8px; font-size: 1.7em; letter-spacing: 0.5px; font-family: 'Segoe UI', Arial, sans-serif;">${subject}</h2>
      </div>
      <div class="main-content" style="color: #333; font-size: 1.08em; margin: 28px 0 36px 0; line-height: 1.7; font-family: 'Segoe UI', Arial, sans-serif;">
        ${text.replace(/\n/g, "<br>")}
      </div>
      <footer class="footer" style="border-top: 1px solid #e3e8f0; padding-top: 18px; text-align: center; color: #888; font-family: 'Segoe UI', Arial, sans-serif;">
        <p style="margin: 0 0 4px 0;">Best regards,</p>
        <p style="margin: 0 0 4px 0; font-weight: 500; color: #1a237e;">Pockity – Storage as a Service</p>
        <a href="mailto:superadmin@bharatbhusal.com" style="display: inline-block; margin-top: 10px; color: #fff; background: #1a237e; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-size: 1em; font-weight: 500;">Contact Support</a>
        <div style="margin-top: 18px; font-size: 0.92em; color: #b0b0b0;">&copy; ${new Date().getFullYear()} Pockity</div>
      </footer>
    </div>
  </body>
  </html>
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
    const text = `Your API Access Key ID is: ${apiAccessKeyId}\nYour Secret Key is: ${secretKey}\n\nPlease keep these keys safe and do not share them with anyone. This is the only time you will see these keys.`;

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
