export interface SmsGateway {
  sendSms(to: string, message: string): Promise<void>;
}
export const SMS_GATEWAY = Symbol("SMS_GATEWAY");
