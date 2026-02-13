import { Resend } from "resend";

let resendInstance: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set. Add it to your environment variables.");
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

/**
 * Get the default "from" address for outbound CRM emails.
 * Falls back to a placeholder if env vars are not set.
 */
export function getDefaultFrom(): { email: string; name: string } {
  return {
    email: process.env.RESEND_FROM_EMAIL || "noreply@example.com",
    name: process.env.RESEND_FROM_NAME || "CRM",
  };
}
