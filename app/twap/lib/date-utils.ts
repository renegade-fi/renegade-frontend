/**
 * Utility functions for date and time operations
 */

const MS_PER_MINUTE = 60 * 1000;
const MINUTES_PER_HOUR = 60;

export interface DateParts {
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
 * Creates a Date object from local date parts (interprets input in the user's timezone)
 */
export function combineDateTimeComponents(date: string, hour: string, minute: string): Date {
    return new Date(`${date}T${hour}:${minute}`);
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
 * Gets UTC date parts representing now minus the provided hours
 */
export function getUtcPartsHoursAgo(hours: number): DateParts {
    const date = new Date(Date.now() - hours * 60 * 60 * 1000);
    return splitUtcDateTimeComponents(date);
}

/**
 * Gets UTC date parts representing one hour ago
 */
export function getOneHourAgoUtcParts(): DateParts {
    return getUtcPartsHoursAgo(1);
}

/**
 * Gets UTC date parts representing twenty-four hours ago
 */
export function getTwentyFourHoursAgoUtcParts(): DateParts {
    return getUtcPartsHoursAgo(24);
}

/**
 * Gets UTC date parts representing the start of the current UTC day
 */
export function getBeginningOfDayUtcParts(): DateParts {
    const now = new Date();
    const startOfDayUtc = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
    );
    return splitUtcDateTimeComponents(startOfDayUtc);
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

/**
 * Formats Date as MM/DD/YYYY - HH:MM:SS (local timezone)
 */
export function formatLocalDateTime(date: Date): string {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} - ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
