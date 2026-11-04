import {
  format,
  parseISO,
  isToday as isTodayDateFns,
  isTomorrow as isTomorrowDateFns,
  isYesterday as isYesterdayDateFns,
  isPast as isPastDateFns,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  subDays,
  addDays,
  startOfMonth,
  endOfMonth,
  getDay,
  parse,
  isValid,
} from 'date-fns';

export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDate(dateStr: string, formatStr: string = 'MMM d, yyyy'): string {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(d)) return dateStr;
    return format(d, formatStr);
  } catch {
    return dateStr;
  }
}

export function formatFriendlyDate(dateStr: string): string {
  try {
    // Treat dateStr (yyyy-MM-dd) at noon local time to avoid timezone boundary jump
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day, 12, 0, 0);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays < 7) return format(d, 'EEEE'); // e.g. Friday
    return format(d, 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatTimeString(timeStr?: string): string {
  if (!timeStr) return '';
  try {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const minute = parseInt(m, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMinute = minute < 10 ? `0${minute}` : minute;
    return `${displayHour}:${displayMinute} ${period}`;
  } catch {
    return timeStr;
  }
}

export function isDateOverdue(dateStr: string, completed: boolean): boolean {
  if (completed) return false;
  const today = getTodayString();
  return dateStr < today;
}

export function isDateToday(dateStr: string): boolean {
  return dateStr === getTodayString();
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getDaysAgo(days: number): string {
  const d = subDays(new Date(), days);
  return format(d, 'yyyy-MM-dd');
}

export function getDaysAhead(days: number): string {
  const d = addDays(new Date(), days);
  return format(d, 'yyyy-MM-dd');
}

export function getWeekDays(referenceDate: Date = new Date()): Date[] {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Monday start
  const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getPastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(getDaysAgo(i));
  }
  return days;
}
