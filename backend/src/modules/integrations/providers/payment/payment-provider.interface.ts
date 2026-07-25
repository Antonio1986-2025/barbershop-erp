export interface ProviderCredentials {
  accessToken?: string;
  publicKey?: string;
  webhookSecret?: string;
  webhookUrl?: string;
  [key: string]: any;
}

export interface CreatePaymentInput {
  amount: number;
  description: string;
  customerEmail?: string;
  customerName?: string;
  customerDocument?: string;
  externalReference?: string;
  paymentMethod?: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  returnUrl?: string;
  credentials?: ProviderCredentials;
}

export interface PaymentResult {
  created: boolean;
  externalPaymentId?: string;
  status?: string;
  paymentUrl?: string;
  pixCode?: string;
  pixQrCode?: string;
  error?: string;
}

export interface PaymentQueryResult {
  found: boolean;
  externalPaymentId?: string;
  status?: string;
  amount?: number;
  paidAt?: Date;
  error?: string;
}

export type ProviderCapability =
  | 'PIX' | 'CARD' | 'BOLETO' | 'CHECKOUT'
  | 'SUBSCRIPTION' | 'REFUND' | 'WEBHOOK';

export interface ProviderInfo {
  id: string;
  name: string;
  version: string;
  capabilities: ProviderCapability[];
  supportsSandbox: boolean;
  supportsProduction: boolean;
}

export interface PaymentProvider {
  readonly name: string;

  getCapabilities(): ProviderCapability[];
  getProviderInfo(): ProviderInfo;

  createPayment(data: CreatePaymentInput): Promise<PaymentResult>;
  getPayment(id: string, credentials?: ProviderCredentials): Promise<PaymentQueryResult>;
  cancelPayment(id: string, credentials?: ProviderCredentials): Promise<{ cancelled: boolean; error?: string }>;
  refundPayment(id: string, amount?: number, credentials?: ProviderCredentials): Promise<{ refunded: boolean; error?: string }>;
  validateWebhook(payload: any, signature?: string): boolean;
  processWebhook(payload: any): Promise<{ event: string; externalPaymentId: string; status: string; data?: any }>;
}
