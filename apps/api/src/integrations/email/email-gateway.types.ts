export interface EmailGateway {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}
export const EMAIL_GATEWAY = Symbol("EMAIL_GATEWAY");
