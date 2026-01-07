import { TwapParams } from "./url-params";
import {
    type ValidationInput,
    validateEndTimeNotInFuture as validateEndTimeNotInFutureCore,
    validateStartDateWithinRetention as validateStartDateWithinRetentionCore,
    validateTradeSize as validateTradeSizeCore,
} from "./validation";

interface FormData {
    start_time: string;
    durationIndex: number;
    input_amount: string;
    selectedBase: string;
    direction: "Buy" | "Sell";
    binance_fee_tier: string;
}

function formDataToValidationInput(data: FormData): ValidationInput {
    const params = TwapParams.fromFormData(data);
    return {
        durationIndex: params.durationIndex,
        size: params.size,
        startDate: params.startDate,
        startHour: params.startHour,
        startMinute: params.startMinute,
        token: params.token,
    };
}

export function validateEndTimeNotInFuture(data: FormData): boolean {
    return validateEndTimeNotInFutureCore(formDataToValidationInput(data));
}

export function validateTradeSizeInRange(data: FormData): boolean {
    return validateTradeSizeCore(formDataToValidationInput(data));
}

export function validateStartDateWithinRetention(data: FormData): boolean {
    return validateStartDateWithinRetentionCore(formDataToValidationInput(data));
}
