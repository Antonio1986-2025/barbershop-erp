export interface WebhookPayload {
  body: any;
  headers: Record<string, string>;
  signature?: string;
}

export interface WebhookResult {
  handled: boolean;
  action?: string;
  data?: any;
}

export interface ProviderCredentials {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
  [key: string]: any;
}

export interface IntegrationProvider {
  readonly name: string;

  validateWebhook(payload: WebhookPayload, secret: string): boolean;
  processWebhook(payload: WebhookPayload): Promise<WebhookResult>;
  sendMessage(destination: string, content: any, credentials?: ProviderCredentials): Promise<any>;
  getStatus(credentials?: ProviderCredentials): Promise<{ connected: boolean; lastPing?: Date }>;
}
