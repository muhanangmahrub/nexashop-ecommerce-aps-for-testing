import nodemailer, { type Transporter } from 'nodemailer';
import { prisma } from './prisma';
import { config } from './config';
import { escapeHtml } from './sanitize';
import { formatPrice } from './utils';

let transporter: Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = config.smtp.host
    ? nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
      })
    : nodemailer.createTransport({ jsonTransport: true });
  return transporter;
}

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f4f5;padding:24px">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;padding:24px">
<h2 style="color:#4f46e5;margin-top:0">NexaShop</h2><h3>${escapeHtml(title)}</h3>${body}
<p style="color:#71717a;font-size:12px;margin-top:32px">This is an automated message from NexaShop.</p></div></body></html>`;
}

const button = (href: string, label: string) =>
  `<p><a href="${href}" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">${label}</a></p><p style="font-size:12px;color:#71717a">Or copy this link: ${href}</p>`;

/** Sends an email (SMTP or mock JSON transport) and records it in EmailLog for test retrieval. */
export async function sendEmail(to: string, subject: string, html: string, meta: Record<string, string> = {}) {
  await prisma.emailLog.create({ data: { to, subject, html, meta } });
  try {
    await getTransporter().sendMail({ from: config.smtp.from, to, subject, html });
  } catch (err) {
    console.error('[email] failed to send', err);
  }
}

export const emails = {
  verification: (to: string, name: string, token: string) => {
    const link = `${config.appUrl}/verify-email?token=${token}`;
    return sendEmail(
      to,
      'Verify your NexaShop email',
      layout('Confirm your email', `<p>Hi ${escapeHtml(name)},</p><p>Please verify your email address.</p>${button(link, 'Verify email')}`),
      { type: 'verification', token, link },
    );
  },
  passwordReset: (to: string, name: string, token: string) => {
    const link = `${config.appUrl}/reset-password?token=${token}`;
    return sendEmail(
      to,
      'Reset your NexaShop password',
      layout('Password reset', `<p>Hi ${escapeHtml(name)},</p><p>This link expires in 1 hour.</p>${button(link, 'Reset password')}`),
      { type: 'password_reset', token, link },
    );
  },
  orderConfirmation: (to: string, name: string, orderNumber: string, total: number) =>
    sendEmail(
      to,
      `Order confirmation ${orderNumber}`,
      layout(
        'Thank you for your order!',
        `<p>Hi ${escapeHtml(name)},</p><p>Your order <b>${orderNumber}</b> totalling <b>${formatPrice(total)}</b> has been received.</p>${button(`${config.appUrl}/account/orders`, 'View orders')}`,
      ),
      { type: 'order_confirmation', orderNumber },
    ),
  orderStatus: (to: string, name: string, orderNumber: string, status: string, tracking?: string | null) =>
    sendEmail(
      to,
      `Order ${orderNumber} is now ${status.toLowerCase()}`,
      layout(
        'Order update',
        `<p>Hi ${escapeHtml(name)},</p><p>Your order <b>${orderNumber}</b> status changed to <b>${status}</b>.</p>${tracking ? `<p>Tracking number: <b>${escapeHtml(tracking)}</b></p>` : ''}`,
      ),
      { type: 'order_status', orderNumber, status },
    ),
  newsletter: (to: string) =>
    sendEmail(to, 'Welcome to the NexaShop newsletter', layout('You are subscribed!', '<p>Expect the best deals in your inbox.</p>'), {
      type: 'newsletter',
    }),
};
