import { Injectable, Logger } from '@nestjs/common';
import { IntegrationProvider, WebhookPayload, WebhookResult, ProviderCredentials } from '../integration-provider.interface';

@Injectable()
export class GoogleProvider implements IntegrationProvider {
  readonly name = 'google_calendar';
  private readonly logger = new Logger(GoogleProvider.name);

  validateWebhook(payload: WebhookPayload, secret: string): boolean {
    return true;
  }

  async processWebhook(payload: WebhookPayload): Promise<WebhookResult> {
    const resource = payload.body?.resource;
    if (!resource) return { handled: false, action: 'unknown' };

    return { handled: true, action: 'calendar_event', data: resource };
  }

  async createEvent(eventData: CalendarEventInput, credentials?: ProviderCredentials): Promise<any> {
    if (!credentials) return { created: false, error: 'credentials_required' };

    const { accessToken, calendarId } = credentials;
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId ?? 'primary')}/events`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: eventData.title,
          description: eventData.description,
          start: { dateTime: eventData.start.toISOString(), timeZone: 'America/Sao_Paulo' },
          end: { dateTime: eventData.end.toISOString(), timeZone: 'America/Sao_Paulo' },
          attendees: eventData.attendeeEmail ? [{ email: eventData.attendeeEmail }] : [],
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? `HTTP ${response.status}`);

      return { created: true, eventId: result.id, htmlLink: result.htmlLink };
    } catch (err: any) {
      this.logger.error(`Google createEvent falhou: ${err.message}`);
      return { created: false, error: err.message };
    }
  }

  async updateEvent(eventId: string, eventData: CalendarEventInput, credentials?: ProviderCredentials): Promise<any> {
    if (!credentials) return { updated: false, error: 'credentials_required' };

    const { accessToken, calendarId } = credentials;
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId ?? 'primary')}/events/${eventId}`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: eventData.title,
          description: eventData.description,
          start: { dateTime: eventData.start.toISOString(), timeZone: 'America/Sao_Paulo' },
          end: { dateTime: eventData.end.toISOString(), timeZone: 'America/Sao_Paulo' },
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? `HTTP ${response.status}`);

      return { updated: true, eventId: result.id };
    } catch (err: any) {
      this.logger.error(`Google updateEvent falhou: ${err.message}`);
      return { updated: false, error: err.message };
    }
  }

  async deleteEvent(eventId: string, credentials?: ProviderCredentials): Promise<any> {
    if (!credentials) return { deleted: false, error: 'credentials_required' };

    const { accessToken, calendarId } = credentials;
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId ?? 'primary')}/events/${eventId}`;

    try {
      const response = await fetch(url, { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } });

      if (!response.ok && response.status !== 410) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message ?? `HTTP ${response.status}`);
      }

      return { deleted: true };
    } catch (err: any) {
      this.logger.error(`Google deleteEvent falhou: ${err.message}`);
      return { deleted: false, error: err.message };
    }
  }

  async sendMessage(destination: string, content: any, credentials?: ProviderCredentials): Promise<any> {
    return this.createEvent(content, credentials);
  }

  async getStatus(credentials?: ProviderCredentials): Promise<{ connected: boolean; lastPing?: Date }> {
    if (!credentials?.accessToken) return { connected: false };

    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { 'Authorization': `Bearer ${credentials.accessToken}` },
      });
      return { connected: response.ok, lastPing: new Date() };
    } catch {
      return { connected: false };
    }
  }
}

export interface CalendarEventInput {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  attendeeEmail?: string;
}
