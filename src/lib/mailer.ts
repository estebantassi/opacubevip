import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

let cachedTransporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options> | null = null;

export default function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  cachedTransporter = transporter;
  return cachedTransporter;
}