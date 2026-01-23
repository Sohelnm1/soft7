import nodemailer from "nodemailer";

export async function sendGmailEmail(config: {
  to: string;
  subject: string;
  message: string;
}) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      throw new Error("Gmail credentials missing in .env");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const result = await transporter.sendMail({
      from: `"Your App" <${process.env.GMAIL_USER}>`,
      to: config.to,
      subject: config.subject,
      text: config.message,
    });

    return { success: true, result };
  } catch (error: any) {
    console.error("Gmail Send Error:", error);
    return { success: false, error: error.message };
  }
}
