/**
 * WhatsApp Business Cloud API only allows free-form text within a 24h
 * customer-service window; anything business-initiated outside that (which
 * a Makazi-triggered notification always is) must use a pre-approved
 * message template — so this takes a template name + ordered params, not
 * a free-text body, matching Meta's actual contract.
 */
export interface WhatsAppGateway {
  sendTemplateMessage(to: string, templateName: string, params: string[]): Promise<void>;
}
export const WHATSAPP_GATEWAY = Symbol("WHATSAPP_GATEWAY");
