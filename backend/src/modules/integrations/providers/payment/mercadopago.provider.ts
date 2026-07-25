import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider, ProviderCapability, CreatePaymentInput, PaymentResult, PaymentQueryResult } from './payment-provider.interface';

const API_BASE = 'https://api.mercadopago.com/v1';
const API_BASE_CHECKOUT = 'https://api.mercadopago.com/checkout';

@Injectable()
export class MercadoPagoProvider implements PaymentProvider {
  readonly name = 'MERCADO_PAGO';
  private readonly logger = new Logger(MercadoPagoProvider.name);

  getCapabilities(): ProviderCapability[] { return ['PIX', 'CARD', 'CHECKOUT', 'REFUND', 'WEBHOOK']; }
  getProviderInfo() { return { id: 'MERCADO_PAGO', name: 'Mercado Pago', version: 'v1', capabilities: this.getCapabilities(), supportsSandbox: true, supportsProduction: true }; }

  private headers(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': this.idempotencyKey(),
    };
  }

  async createPayment(data: CreatePaymentInput): Promise<PaymentResult> {
    const creds = data.credentials;
    if (!creds?.accessToken) return { created: false, error: 'access_token_required' };

    if (data.paymentMethod === 'PIX' || !data.paymentMethod) {
      return this.createPix(data, creds.accessToken, creds.webhookUrl);
    }
    if (data.paymentMethod === 'CREDIT_CARD') {
      return this.createCard(data, creds.accessToken);
    }
    return this.createPreference(data, creds.accessToken);
  }

  private async createPix(data: CreatePaymentInput, token: string, webhookUrl?: string): Promise<PaymentResult> {
    try {
      const body: any = { transaction_amount: data.amount, description: data.description, payment_method_id: 'pix', payer: { email: data.customerEmail ?? 'cliente@email.com' } };
      if (data.externalReference) body.external_reference = data.externalReference;
      if (webhookUrl) body.notification_url = webhookUrl;

      const res = await fetch(`${API_BASE}/payments`, { method: 'POST', headers: this.headers(token), body: JSON.stringify(body) });
      const r = await res.json();
      if (!res.ok) throw new Error(r.message ?? JSON.stringify(r));

      const pix = r.point_of_interaction?.transaction_data ?? {};
      return { created: true, externalPaymentId: r.id?.toString(), status: r.status, paymentUrl: r.init_point, pixCode: pix.qr_code, pixQrCode: pix.qr_code_base64 };
    } catch (err: any) {
      this.logger.error(`MP PIX: ${err.message}`); return { created: false, error: err.message };
    }
  }

  private async createCard(data: CreatePaymentInput, token: string): Promise<PaymentResult> {
    try {
      const body: any = { transaction_amount: data.amount, description: data.description, payment_method_id: 'visa', payer: { email: data.customerEmail ?? 'cliente@email.com' }, installments: 1 };
      if (data.externalReference) body.external_reference = data.externalReference;
      const res = await fetch(`${API_BASE}/payments`, { method: 'POST', headers: this.headers(token), body: JSON.stringify(body) });
      const r = await res.json();
      if (!res.ok) throw new Error(r.message ?? JSON.stringify(r));
      return { created: r.status === 'approved', externalPaymentId: r.id?.toString(), status: r.status };
    } catch (err: any) {
      this.logger.error(`MP Card: ${err.message}`); return { created: false, error: err.message };
    }
  }

  private async createPreference(data: CreatePaymentInput, token: string): Promise<PaymentResult> {
    try {
      const res = await fetch(`${API_BASE_CHECKOUT}/preferences`, {
        method: 'POST', headers: this.headers(token),
        body: JSON.stringify({ items: [{ title: data.description, quantity: 1, unit_price: data.amount }], payer: { email: data.customerEmail ?? 'cliente@email.com' }, external_reference: data.externalReference, back_urls: { success: data.returnUrl, failure: data.returnUrl } }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.message ?? JSON.stringify(r));
      return { created: true, externalPaymentId: r.id, status: 'pending', paymentUrl: r.init_point };
    } catch (err: any) {
      this.logger.error(`MP Pref: ${err.message}`); return { created: false, error: err.message };
    }
  }

  async getPayment(id: string, credentials?: any): Promise<PaymentQueryResult> {
    const token = credentials?.accessToken;
    if (!token) return { found: false, error: 'access_token_required' };
    try {
      const res = await fetch(`${API_BASE}/payments/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const r = await res.json();
      if (!res.ok) throw new Error(r.message ?? 'not_found');
      return { found: true, externalPaymentId: r.id?.toString(), status: r.status, amount: r.transaction_amount, paidAt: r.date_approved ? new Date(r.date_approved) : undefined };
    } catch (err: any) { return { found: false, error: err.message }; }
  }

  async cancelPayment(id: string, credentials?: any): Promise<{ cancelled: boolean; error?: string }> {
    const token = credentials?.accessToken;
    if (!token) return { cancelled: false, error: 'access_token_required' };
    try {
      const res = await fetch(`${API_BASE}/payments/${id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message ?? `HTTP ${res.status}`); }
      return { cancelled: true };
    } catch (err: any) { return { cancelled: false, error: err.message }; }
  }

  async refundPayment(id: string, amount?: number, credentials?: any): Promise<{ refunded: boolean; error?: string }> {
    const token = credentials?.accessToken;
    if (!token) return { refunded: false, error: 'access_token_required' };
    try {
      const url = amount ? `${API_BASE}/payments/${id}/refunds?amount=${amount}` : `${API_BASE}/payments/${id}/refunds`;
      const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message ?? `HTTP ${res.status}`); }
      return { refunded: true };
    } catch (err: any) { return { refunded: false, error: err.message }; }
  }

  validateWebhook(payload: any, signature?: string): boolean {
    if (!signature) return false;
    try {
      const crypto = require('crypto');
      const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
      return signature === crypto.createHmac('sha256', 'webhookSecret').update(data).digest('hex');
    } catch { return false; }
  }

  async processWebhook(payload: any): Promise<{ event: string; externalPaymentId: string; status: string; data?: any }> {
    const action = payload?.action ?? payload?.type ?? 'unknown';
    const paymentId = payload?.data?.id?.toString() ?? '';
    if (action === 'payment.created' || action === 'payment.updated') {
      const result = await this.getPayment(paymentId);
      return { event: action, externalPaymentId: paymentId, status: result.status ?? 'unknown', data: result };
    }
    return { event: action, externalPaymentId: paymentId, status: 'unknown' };
  }

  private idempotencyKey(): string { const crypto = require('crypto'); return crypto.randomUUID(); }
}
