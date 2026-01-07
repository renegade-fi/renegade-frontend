import { DATA_RETENTION_DAYS } from "./constants";

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MINUTES_PER_HOUR = 60;

interface DateParts {
    date: string;
    hour: string;
    minute: string;
}

const pad = (value: number) => value.toString().padStart(2, "0");

/**
 * Extracts local date parts (used for client-side display only)
 */
export function splitDateTimeComponents(date: Date): DateParts {
    return {
        date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
        hour: pad(date.getHours()),
        minute: pad(date.getMinutes()),
    };
}

/**
 * Extracts UTC date parts from a Date instance
 */
export function splitUtcDateTimeComponents(date: Date): DateParts {
    return {
        date: date.toISOString().slice(0, 10),
        hour: pad(date.getUTCHours()),
        minute: pad(date.getUTCMinutes()),
    };
}

/**
 * Creates a Date object from UTC date parts
 */
export function combineUtcDateTimeComponents(date: string, hour: string, minute: string): Date {
    const [year, month, day] = date.split("-").map(Number);
    const hours = Number(hour);
    const minutes = Number(minute);
    return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1, hours, minutes, 0, 0));
}

/**
 * Formats UTC date parts to an ISO string
 */
export function formatUtcDateParts(parts: DateParts): string {
    return `${parts.date}T${parts.hour}:${parts.minute}:00Z`;
}

/**
 * Parses an ISO string into UTC date parts
 */
export function parseIsoToUtcParts(isoString: string): DateParts {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid ISO date string: ${isoString}`);
    }
    return splitUtcDateTimeComponents(date);
}

/**
 * Calculates the duration between two dates in hours and minutes
 */
export function calculateDuration(
    startDate: Date,
    endDate: Date,
): {
    hours: number;
    minutes: number;
} {
    const diffMs = endDate.getTime() - startDate.getTime();
    const totalMinutes = Math.floor(diffMs / MS_PER_MINUTE);
    const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
    const minutes = totalMinutes % MINUTES_PER_HOUR;

    return { hours, minutes };
}

/**
 * Calculates end date from start date and duration
 */
export function calculateEndDate(startDate: Date, hours: number, minutes: number): Date {
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + hours);
    endDate.setMinutes(endDate.getMinutes() + minutes);
    return endDate;
}

export function formatLocalDateTime(date: Date): string {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} - ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getDateBounds(): { min: Date; max: Date } {
    const now = new Date();
    const min = new Date(now.getTime() - DATA_RETENTION_DAYS * MS_PER_DAY);
    return { max: now, min };
}

export function getCalendarBounds(): { min: Date; max: Date } {
    const { min, max } = getDateBounds();
    // LOCAL time - only runs on client for calendar display
    const startOfMinDayLocal = new Date(min.getFullYear(), min.getMonth(), min.getDate());
    const calendarMin = new Date(startOfMinDayLocal.getTime() + MS_PER_DAY);
    return { max, min: calendarMin };
}

export function getDefaultStartTime(): Date {
    return new Date(Date.now() - MS_PER_HOUR);
}
