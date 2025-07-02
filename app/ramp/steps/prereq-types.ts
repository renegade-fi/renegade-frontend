/**
 * Enumerates the kinds of prerequisite checks a core transaction step can
 * request the sequence-builder to satisfy before it executes.
 *
 * Keeping this in its own module avoids circular import concerns between
 * step classes and the sequence builder.
 */
export enum Prereq {
    APPROVAL = "APPROVAL",
    PERMIT2 = "PERMIT2",
    PAY_FEES = "PAY_FEES",
}
