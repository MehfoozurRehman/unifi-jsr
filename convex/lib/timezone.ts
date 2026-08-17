import { DateTime } from "luxon";

export function toUtcTimestamp(dateInput: string | number | Date): number {
  if (typeof dateInput === "number") {
    // If seconds, convert to ms
    return dateInput < 10000000000 ? dateInput * 1000 : dateInput;
  }
  if (dateInput instanceof Date) {
    return dateInput.getTime();
  }
  const dt = DateTime.fromISO(dateInput, { setZone: true });
  if (dt.isValid) {
    return dt.toMillis();
  }
  const fallback = new Date(dateInput).getTime();
  return isNaN(fallback) ? Date.now() : fallback;
}

export function formatForJisr(
  timestampMs: number,
  zone: string = "Asia/Riyadh"
): {
  timestampIso: string;
  localDate: string;
  localTime: string;
  localDateTime: string;
} {
  const dt = DateTime.fromMillis(timestampMs).setZone(zone);
  return {
    timestampIso: dt.toISO() ?? new Date(timestampMs).toISOString(),
    localDate: dt.toFormat("yyyy-MM-dd"),
    localTime: dt.toFormat("HH:mm:ss"),
    localDateTime: dt.toFormat("yyyy-MM-dd HH:mm:ss"),
  };
}
