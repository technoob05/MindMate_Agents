/**
 * Represents an email message.
 */
export interface EmailMessage {
  /**
   * The sender of the email.
   */
  sender: string;
  /**
   * The recipient of the email.
   */
  recipient: string;
  /**
   * The subject of the email.
   */
  subject: string;
  /**
   * The body of the email.
   */
  body: string;
}

/**
 * Asynchronously sends an email message.
 *
 * @param message The email message to send.
 * @returns A promise that resolves when the email is sent.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  // TODO: Implement this by calling an API.
  console.log('Sending email:', message);
}
