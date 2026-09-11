// Email API client — matches app/api/v1/routers/email_router.py.
import { apiClient } from "../utils/apiClient";

export interface CandidateEmailPayload {
  to_email: string;
  to_name?: string;
  subject: string;
  body: string;
  is_interview?: boolean;
  interview_date?: string;
  interview_time?: string;
  meeting_link?: string;
  candidate_id?: number;
}

export interface EmailSendResult {
  success: boolean;
  status: "sent" | "smtp_not_configured" | "smtp_error" | "error";
  message: string;
  provider?: string;
  recipient: string;
}

export const emailApi = {
  send: (data: CandidateEmailPayload) =>
    apiClient.post<EmailSendResult>("/emails/send", data),
};

/**
 * Generate a direct web compose URL for Gmail Web.
 */
export function createGmailComposeUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to,
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/**
 * Generate a direct web compose URL for Outlook Live / Office 365.
 */
export function createOutlookComposeUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({
    to,
    subject,
    body,
  });
  return `https://outlook.live.com/mail/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate a standard mailto: link for default system email clients.
 */
export function createMailtoUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({
    subject,
    body,
  });
  return `mailto:${encodeURIComponent(to)}?${params.toString()}`;
}
