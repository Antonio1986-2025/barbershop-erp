'use client';

import type { Appointment as AppointmentType } from '@/lib/appointments';

const HOUR_HEIGHT = 64;
const START_HOUR = 8;
const END_HOUR = 21;

const DAY_NAMES = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const STATUS_BG: Record<string, string> = {
  SCHEDULED: '#3b82f6',
  CONFIRMED: '#22c55e',
  IN_PROGRESS: '#f59e0b',
  COMPLETED: '#6b7280',
  CANCELED: '#ef4444',
  NO_SHOW: '#f97316',
};

interface WeeklyCalendarProps {
  appointments: AppointmentType[];
  weekStart: Date;
  onWeekChange: (newStart: Date) => void;
  onSlotClick?: (date: Date, hour: number) => void;
  onAppointmentClick?: (appt: AppointmentType) => void;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function formatDateBR(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

function formatDateFull(d: Date): string {
  return formatDateBR(d) + '/' + d.getFullYear();
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export default function WeeklyCalendar({
  appointments,
  weekStart,
  onWeekChange,
  onSlotClick,
  onAppointmentClick,
}: WeeklyCalendarProps) {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = startOfDay(new Date());

  function prevWeek() {
    onWeekChange(addDays(weekStart, -7));
  }

  function nextWeek() {
    onWeekChange(addDays(weekStart, 7));
  }

  function goToday() {
    onWeekChange(getMonday(new Date()));
  }

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  function getAppointmentsForDay(date: Date) {
    const start = startOfDay(date).toISOString();
    const end = endOfDay(date).toISOString();
    return appointments.filter(a => a.startAt >= start && a.endAt <= end);
  }

  function getTop(startAt: string) {
    const d = new Date(startAt);
    const totalMinutes = d.getUTCHours() * 60 + d.getUTCMinutes();
    const startMinutes = START_HOUR * 60;
    return ((totalMinutes - startMinutes) / 60) * HOUR_HEIGHT;
  }

  function getHeight(startAt: string, endAt: string) {
    const start = new Date(startAt);
    const end = new Date(endAt);
    const durationMin = (end.getTime() - start.getTime()) / 60000;
    return (durationMin / 60) * HOUR_HEIGHT;
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  }

  function handleSlotClick(day: Date, hour: number) {
    const clicked = new Date(day);
    clicked.setUTCHours(hour, 0, 0, 0);
    onSlotClick?.(clicked, hour);
  }

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button className="rounded border px-2 py-1 text-sm hover:bg-zinc-100" onClick={prevWeek}>&lt;</button>
          <button className="rounded border px-3 py-1 text-sm hover:bg-zinc-100" onClick={goToday}>Hoje</button>
          <button className="rounded border px-2 py-1 text-sm hover:bg-zinc-100" onClick={nextWeek}>&gt;</button>
        </div>
        <span className="text-sm font-medium text-zinc-700">
          {formatDateBR(weekDays[0])} — {formatDateFull(weekDays[6])}
        </span>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {Object.entries(STATUS_BG).slice(0, 4).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
              {status === 'SCHEDULED' ? 'Agendado' : status === 'CONFIRMED' ? 'Confirmado' : status === 'IN_PROGRESS' ? 'Em Andamento' : 'Concluído'}
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-auto rounded-lg border">
        <div className="flex" style={{ minWidth: 800 }}>
          <div className="w-14 flex-shrink-0 border-r bg-zinc-50">
            <div className="h-8 border-b" />
            {hours.map(h => (
              <div key={h} className="flex items-start justify-center border-b pt-0.5 text-xs text-zinc-400" style={{ height: HOUR_HEIGHT }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {weekDays.map(day => {
            const dayAppts = getAppointmentsForDay(day);
            const isToday = sameDay(day, today);

            return (
              <div key={day.toISOString()} className="flex-1 border-r last:border-r-0">
                <div className={`flex h-8 items-center justify-center gap-1 border-b text-xs font-medium ${isToday ? 'bg-blue-50 text-blue-700' : 'bg-zinc-50 text-zinc-600'}`}>
                  <span>{DAY_NAMES[day.getDay()]}</span>
                  <span className={isToday ? 'flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white' : ''}>
                    {day.getDate()}
                  </span>
                </div>

                <div className="relative">
                  {hours.map(h => (
                    <div
                      key={h}
                      className="cursor-pointer border-b border-dashed border-zinc-100 hover:bg-blue-50/30"
                      style={{ height: HOUR_HEIGHT }}
                      onClick={() => handleSlotClick(day, h)}
                    />
                  ))}

                  {dayAppts.map(appt => (
                    <div
                      key={appt.id}
                      className="absolute left-0.5 right-0.5 cursor-pointer overflow-hidden rounded px-1 py-0.5 text-white transition hover:brightness-110"
                      style={{
                        top: getTop(appt.startAt),
                        height: Math.max(getHeight(appt.startAt, appt.endAt), 28),
                        backgroundColor: STATUS_BG[appt.status] ?? '#6b7280',
                        opacity: appt.status === 'CANCELED' ? 0.6 : 1,
                        zIndex: 10,
                      }}
                      onClick={() => onAppointmentClick?.(appt)}
                    >
                      <p className="truncate text-xs font-semibold leading-tight">{appt.customer.name}</p>
                      <p className="truncate text-xs leading-tight opacity-90">{appt.service.name}</p>
                      <p className="truncate text-xs leading-tight opacity-75">
                        {formatTime(appt.startAt)} - {formatTime(appt.endAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
