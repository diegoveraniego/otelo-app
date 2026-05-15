import { 
  format, 
  addDays, 
  startOfWeek, 
  isBefore, 
  isAfter, 
  setHours, 
  setMinutes, 
  parseISO,
  isSameDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { FeedingSlotWithDetails } from './types';

export const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const DAY_NAMES_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const SLOT_LABELS = { morning: 'Mañana', evening: 'Tarde' };

export const SLOT_HOURS = {
  morning: { start: 6, end: 12 },
  evening: { start: 17, end: 23 }
};

/**
 * Gets the YYYY-MM-DD string for the Monday of the week containing the given date.
 */
export function getWeekStart(date: Date = new Date()): string {
  // force start of week to Monday (1)
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
}

/**
 * Gets the specific Date object for a slot based on week start and day of week index.
 */
export function getSlotDate(weekStart: string, dayOfWeek: number): Date {
  // Use T00:00:00 to ensure local time parsing across all browsers
  const monday = new Date(weekStart + 'T00:00:00');
  return addDays(monday, dayOfWeek);
}

/**
 * Checks if a slot should be marked as "overdue" (not fed and window closed).
 */
export function isSlotOverdue(slot: FeedingSlotWithDetails): boolean {
  if (slot.fed_at) return false;
  
  const slotDate = getSlotDate(slot.week_start, slot.day_of_week);
  const windowEnd = setHours(setMinutes(slotDate, 0), SLOT_HOURS[slot.slot].end);
  
  return isAfter(new Date(), windowEnd);
}

/**
 * Checks if a slot is "active now" (within feeding window).
 */
export function isSlotNow(slot: FeedingSlotWithDetails): boolean {
  if (slot.fed_at) return false;
  
  const now = new Date();
  const slotDate = getSlotDate(slot.week_start, slot.day_of_week);
  
  if (!isSameDay(now, slotDate)) return false;
  
  const hour = now.getHours();
  const window = SLOT_HOURS[slot.slot];
  return hour >= window.start && hour < window.end;
}

/**
 * Checks if a slot was fed later than the intended window.
 */
export function wasFedLate(slot: FeedingSlotWithDetails): boolean {
  if (!slot.fed_at) return false;
  
  const slotDate = getSlotDate(slot.week_start, slot.day_of_week);
  const windowEnd = setHours(setMinutes(slotDate, 0), SLOT_HOURS[slot.slot].end);
  
  return isAfter(new Date(slot.fed_at), windowEnd);
}

/**
 * Formats the feeding time for display.
 */
export function formatFedTime(isoDate: string): string {
  return format(new Date(isoDate), "HH:mm 'hrs'", { locale: es });
}

/**
 * Formats a date range for the week header.
 */
export function formatWeekRange(weekStart: string): string {
  const start = parseISO(weekStart);
  const end = addDays(start, 6);
  
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, 'd')} - ${format(end, 'd MMMM')}`;
  }
  return `${format(start, 'd MMM')} - ${format(end, 'd MMM')}`;
}

/**
 * Calculates how many slots each member has assigned in a list of slots.
 */
export function getWeeklyAssignmentCount(slots: FeedingSlotWithDetails[]) {
  const counts: Record<string, number> = {};
  slots.forEach(s => {
    if (s.assigned_to) {
      counts[s.assigned_to] = (counts[s.assigned_to] || 0) + 1;
    }
  });
  return counts;
}
