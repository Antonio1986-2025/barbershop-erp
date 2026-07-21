import { getToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface Appointment {
  id: string;
  companyId: string;
  unitId: string;
  professionalId: string;
  customerId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  status: string;
  notes: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  rescheduledFromId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  professional: { id: string; name: string; avatar?: string | null };
  customer: { id: string; name: string; phone?: string | null };
  service: { id: string; name: string; durationMinutes: number; price: number; color?: string | null };
  unit?: { id: string; name: string };
}

export const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
  NO_SHOW: 'Não Compareceu',
};

export const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-orange-100 text-orange-800',
};

export async function fetchAppointments(params: {
  unitId?: string;
  professionalId?: string;
  customerId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Appointment[]> {
  const url = new URL(`${API_BASE}/api/appointments`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAppointment(id: string): Promise<Appointment> {
  const res = await fetch(`${API_BASE}/api/appointments/${id}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAppointmentsCalendar(params: {
  startDate: string;
  endDate: string;
  unitId?: string;
  professionalId?: string;
}): Promise<Appointment[]> {
  const url = new URL(`${API_BASE}/api/appointments/calendar`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  const res = await fetch(url.toString(), { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createAppointment(data: {
  unitId: string;
  professionalId: string;
  customerId: string;
  serviceId: string;
  startAt: string;
  notes?: string;
}): Promise<Appointment> {
  const res = await fetch(`${API_BASE}/api/appointments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment> {
  const res = await fetch(`${API_BASE}/api/appointments/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function cancelAppointment(id: string, reason?: string): Promise<Appointment> {
  const res = await fetch(`${API_BASE}/api/appointments/${id}/cancel`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function rescheduleAppointment(id: string, newStartAt: string, reason?: string): Promise<Appointment> {
  const res = await fetch(`${API_BASE}/api/appointments/${id}/reschedule`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ newStartAt, reason }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateAppointmentStatus(id: string, status: string): Promise<Appointment> {
  const res = await fetch(`${API_BASE}/api/appointments/${id}/status`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteAppointment(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/appointments/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
}
