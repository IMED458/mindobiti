// Utility functions for dates, formatting, age calculations, leap year rules

/**
 * Format ISO YYYY-MM-DD date string to DD/MM/YYYY
 */
export function formatDateToGeorgian(isoString?: string): string {
  if (!isoString) return '';
  const parts = isoString.split('T')[0].split('-');
  if (parts.length !== 3) return isoString;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

/**
 * Parse DD/MM/YYYY to ISO YYYY-MM-DD
 */
export function parseGeorgianDateToISO(georgianDateStr: string): string {
  if (!georgianDateStr) return '';
  const parts = georgianDateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return georgianDateStr;
}

/**
 * Check if a given year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Calculate exact 18th birthday date considering Feb 29 leap year rule
 */
export function get18thBirthdayISO(birthDateISO: string): string {
  const [yearStr, monthStr, dayStr] = birthDateISO.split('-');
  const birthYear = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const targetYear = birthYear + 18;

  // Leap year Feb 29 special handling:
  // If born Feb 29 and target 18th year is NOT a leap year, use Feb 28.
  if (month === 2 && day === 29) {
    if (!isLeapYear(targetYear)) {
      return `${targetYear}-02-28`;
    }
  }

  // Handle standard dates
  const paddedMonth = String(month).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');
  return `${targetYear}-${paddedMonth}-${paddedDay}`;
}

/**
 * Calculate exact 21st birthday date considering Feb 29 leap year rule
 */
export function get21stBirthdayISO(birthDateISO: string): string {
  const [yearStr, monthStr, dayStr] = birthDateISO.split('-');
  const birthYear = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const targetYear = birthYear + 21;

  if (month === 2 && day === 29) {
    if (!isLeapYear(targetYear)) {
      return `${targetYear}-02-28`;
    }
  }

  const paddedMonth = String(month).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');
  return `${targetYear}-${paddedMonth}-${paddedDay}`;
}

/**
 * Calculate exact age in completed years as of a given target date (defaults to today in Tbilisi timezone)
 */
export function calculateAge(birthDateISO: string, referenceDateISO?: string): number {
  const birth = new Date(birthDateISO);
  const ref = referenceDateISO ? new Date(referenceDateISO) : new Date();

  let age = ref.getFullYear() - birth.getFullYear();
  const monthDiff = ref.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
    age--;
  }

  return Math.max(0, age);
}

/**
 * Add calendar days to an ISO date YYYY-MM-DD
 */
export function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Add or subtract calendar months from an ISO date YYYY-MM-DD
 */
export function addMonthsISO(dateISO: string, months: number): string {
  const [yearStr, monthStr, dayStr] = dateISO.split('-');
  let y = parseInt(yearStr, 10);
  let m = parseInt(monthStr, 10) - 1 + months;
  let d = parseInt(dayStr, 10);

  const targetYear = y + Math.floor(m / 12);
  const targetMonth = ((m % 12) + 12) % 12; // 0-indexed

  // Days in target month
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const safeDay = Math.min(d, daysInTargetMonth);

  const paddedMonth = String(targetMonth + 1).padStart(2, '0');
  const paddedDay = String(safeDay).padStart(2, '0');

  return `${targetYear}-${paddedMonth}-${paddedDay}`;
}

/**
 * Calculate difference in calendar days between two ISO dates (date2 - date1)
 */
export function diffDaysISO(date1ISO: string, date2ISO: string): number {
  const d1 = new Date(date1ISO);
  const d2 = new Date(date2ISO);
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Get current ISO date YYYY-MM-DD in Asia/Tbilisi timezone
 */
export function getTodayTbilisiISO(): string {
  const now = new Date();
  // Format to Tbilisi time
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Tbilisi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const day = parts.find((p) => p.type === 'day')?.value || '';
  return `${year}-${month}-${day}`;
}
