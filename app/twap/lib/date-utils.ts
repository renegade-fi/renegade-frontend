/**
 * Utility functions for date and time operations
 */

const MS_PER_MINUTE = 60 * 1000;
const MINUTES_PER_HOUR = 60;

/**
 * Extracts the date portion (YYYY-MM-DD) from a Date object
 */
export function getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Extracts the hour (00-23) from a Date object as a zero-padded string
 */
export function getHourString(date: Date): string {
    return date.getHours().toString().padStart(2, "0");
}

/**
 * Extracts the minute (00-59) from a Date object as a zero-padded string
 */
export function getMinuteString(date: Date): string {
    return date.getMinutes().toString().padStart(2, "0");
}

/**
 * Splits a Date object into date, hour, and minute strings
 */
export function splitDateTimeComponents(date: Date): {
    date: string;
    hour: string;
    minute: string;
} {
    return {
        date: getDateString(date),
        hour: getHourString(date),
        minute: getMinuteString(date),
    };
}

/**
 * Creates a Date object from date, hour, and minute strings
 */
export function combineDateTimeComponents(date: string, hour: string, minute: string): Date {
    return new Date(`${date}T${hour}:${minute}`);
}

/**
 * Formats a Date object as an ISO datetime string (YYYY-MM-DDTHH:mm)
 */
export function formatDateTimeForInput(date: Date): string {
    const { date: dateStr, hour, minute } = splitDateTimeComponents(date);
    return `${dateStr}T${hour}:${minute}`;
}

/**
 * Gets a Date object representing one hour ago
 */
export function getOneHourAgo(): Date {
    const date = new Date();
    date.setHours(date.getHours() - 1);
    return date;
}

/**
 * Gets a Date object representing twenty-four hours ago
 */
export function getTwentyFourHoursAgo(): Date {
    const date = new Date();
    date.setHours(date.getHours() - 24);
    return date;
}

/**
 * Gets a Date object representing the beginning of the current day (00:00)
 */
export function getBeginningOfDay(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
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
