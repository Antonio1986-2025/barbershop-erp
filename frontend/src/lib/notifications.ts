import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface Notification {
  id: string;
  companyId: string;
  userId: string | null;
  customerId: string | null;
  type: string;
  channel: string;
  title: string;
  message: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  readAt: string | null;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string } | null;
}

export interface NotificationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NotificationListResponse {
  data: Notification[];
  meta: NotificationMeta;
}

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  APPOINTMENT_CREATED: 'Agendamento Criado',
  APPOINTMENT_CONFIRMED: 'Agendamento Confirmado',
  APPOINTMENT_CANCELLED: 'Agendamento Cancelado',
  APPOINTMENT_RESCHEDULED: 'Agendamento Reagendado',
  APPOINTMENT_REMINDER: 'Lembrete de Atendimento',
};

export const NOTIFICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  SENT: 'Enviada',
  FAILED: 'Falhou',
  READ: 'Lida',
};

export const NOTIFICATION_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SENT: 'bg-blue-100 text-blue-800',
  FAILED: 'bg-red-100 text-red-800',
  READ: 'bg-gray-100 text-gray-800',
};

export async function fetchNotifications(params: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  channel?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<NotificationListResponse> {
  const url = new URL(`${API_BASE}/api/notifications`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchNotification(id: string): Promise<Notification> {
  const res = await fetch(`${API_BASE}/api/notifications/${id}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await fetch(`${API_BASE}/api/notifications/unread-count`, { headers: headers() });
  if (!res.ok) return 0;
  const data = await res.json();
  return typeof data === 'number' ? data : 0;
}
