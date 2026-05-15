import { FeedingSlotWithDetails } from './types';
import { startOfWeek, format, addDays } from 'date-fns';

export const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const DAY_NAMES_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const SLOT_LABELS = {
  morning: 'Mañana',
  evening: 'Tarde',
} as const;

// Morning: 06:00–15:59, Evening: 16:00–23:59
export const SLOT_HOURS = {
  morning: { start: 6, end: 16 },   // 6am to 4pm (exclusive)
  evening: { start: 16, end: 24 },  // 4pm to midnight
} as const;

/** Returns the Monday of the given date as 'YYYY-MM-DD' */
export function getWeekStart(date: Date = new Date()): string {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
}

/** Returns the actual Date object for a given (week_start, day_of_week) */
export function getSlotDate(weekStart: string, dayOfWeek: number): Date {
  const monday = new Date(weekStart + 'T00:00:00');
  return addDays(monday, dayOfWeek);
}

/** Returns which slot we're currently in based on local time */
export function getCurrentSlot(now: Date = new Date()): 'morning' | 'evening' {
  const hour = now.getHours();
  return hour >= SLOT_HOURS.evening.start ? 'evening' : 'morning';
}

/** Returns the day_of_week (0=Mon … 6=Sun) for today relative to ISO week */
export function getTodayDayOfWeek(now: Date = new Date()): number {
  // getDay() returns 0=Sun…6=Sat, convert to 0=Mon…6=Sun
  const jsDay = now.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * Is this slot's window already over without being fed?
 * A slot is overdue if:
 *   - The slot's day is in the past, OR
 *   - The slot's day is today but the time window has already ended
 */
export function isSlotOverdue(
  slot: FeedingSlotWithDetails,
  now: Date = new Date()
): boolean {
  if (slot.fed_at) return false; // already done, not overdue

  const slotDate = getSlotDate(slot.week_start, slot.day_of_week);
  const slotEndHour = SLOT_HOURS[slot.slot].end;

  // Slot date at end-of-window timestamp
  const windowEnd = new Date(slotDate);
  windowEnd.setHours(slotEndHour, 0, 0, 0);

  return now > windowEnd;
}

/**
 * Is this slot happening right now (today + current time window)?
 */
export function isSlotNow(
  slot: FeedingSlotWithDetails,
  now: Date = new Date()
): boolean {
  const todayDow = getTodayDayOfWeek(now);
  if (slot.day_of_week !== todayDow) return false;
  const currentSlot = getCurrentSlot(now);
  return slot.slot === currentSlot;
}

/**
 * Was the slot fed outside its intended window?
 * (The person registered it, but after the window ended — flexible ok)
 */
export function wasFedLate(slot: FeedingSlotWithDetails): boolean {
  if (!slot.fed_at) return false;

  const fedAt = new Date(slot.fed_at);
  const slotDate = getSlotDate(slot.week_start, slot.day_of_week);
  const windowEnd = new Date(slotDate);
  windowEnd.setHours(SLOT_HOURS[slot.slot].end, 0, 0, 0);

  return fedAt > windowEnd;
}

/**
 * How many times is each member assigned this week?
 * Returns Record<member_id, count>
 */
export function getWeeklyAssignmentCount(
  slots: FeedingSlotWithDetails[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  slots.forEach((s) => {
    if (s.assigned_to) {
      counts[s.assigned_to] = (counts[s.assigned_to] ?? 0) + 1;
    }
  });
  return counts;
}

/** Format fed_at time nicely: "a las 08:30" */
export function formatFedTime(fed_at: string): string {
  const d = new Date(fed_at);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `a las ${h}:${m}`;
}
