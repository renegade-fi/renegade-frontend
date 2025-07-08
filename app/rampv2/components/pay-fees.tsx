import { payFees } from "@renegade-fi/react/actions";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { numFeesQuery, type QueryParams } from "../queries/renegade-balance";

const MIN_FEES = 2;

/** Effect that pays fees when the number of fees in the back of queue wallet is greater than or equal to MIN_FEES. */
export function PayFees(props: QueryParams) {
    const { data: numFees, isSuccess } = useQuery(numFeesQuery(props));
    useEffect(() => {
        if (!props.renegadeConfig || !isSuccess || numFees < MIN_FEES) return;
        payFees(props.renegadeConfig);
    }, [props.renegadeConfig, isSuccess, numFees]);
    return null;
}
