import { PaymentProvider, CreatePaymentLinkParams, CreatePaymentLinkResult } from "./types.js";

export class ManualPaymentProvider implements PaymentProvider {
  async createPaymentLink(params: CreatePaymentLinkParams): Promise<CreatePaymentLinkResult> {
    const transactionId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      url: "",
      transactionId,
      sandbox: false,
    };
  }
}
