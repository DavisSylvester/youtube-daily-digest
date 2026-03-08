import { Resend } from 'resend';
import { env } from '../env.mts';
import { logger } from '../config/logger.mts';

export async function sendDigestEmail(subject: string, html: string): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !env.EMAIL_TO) {
    logger.warn('Email skipped — RESEND_API_KEY, EMAIL_FROM, or EMAIL_TO not set');
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  const result = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [env.EMAIL_TO],
    subject,
    html,
  });

  if ('error' in result && result.error) {
    throw new Error(result.error.message);
  }
}
