import { z } from "zod";

// Single chart datum schema
export const ChartDatumSchema = z.object({
    date: z.string(),
    desktop: z.number(),
    mobile: z.number(),
});

// Array of datapoints returned by loadChartData
export const ChartDataResponseSchema = z.array(ChartDatumSchema);

// Inferred types
export type ChartDatum = z.infer<typeof ChartDatumSchema>;
export type ChartDataResponse = z.infer<typeof ChartDataResponseSchema>;
