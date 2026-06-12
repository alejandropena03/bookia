export interface CreatePaymentLinkParams {
  amount: number;
  currency: string;
  reference: string;
  redirectUrl?: string;
  description: string;
}

export interface CreatePaymentLinkResult {
  url: string;
  transactionId: string;
  sandbox: boolean;
}

export interface PaymentProvider {
  createPaymentLink(params: CreatePaymentLinkParams): Promise<CreatePaymentLinkResult>;
}
