"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getBeginningOfDay, getOneHourAgo, splitDateTimeComponents } from "../lib/date-utils";

interface DateTimePickerProps {
    id?: string;
    name?: string;
    defaultValue?: string;
    className?: string;
    onChange?: (value: string) => void;
}

export function DateTimePicker({
    id,
    name,
    defaultValue,
    className,
    onChange,
}: DateTimePickerProps) {
    // Parse default value or use current time
    const defaultDate = defaultValue ? new Date(defaultValue) : new Date();
    const defaultComponents = splitDateTimeComponents(defaultDate);

    const [date, setDate] = React.useState(defaultComponents.date);
    const [hour, setHour] = React.useState(defaultComponents.hour);
    const [minute, setMinute] = React.useState(defaultComponents.minute);

    // Update combined value when any part changes
    React.useEffect(() => {
        const combined = `${date}T${hour}:${minute}`;
        onChange?.(combined);
    }, [date, hour, minute, onChange]);

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

    const setOneHourAgo = () => {
        const oneHourAgoDate = getOneHourAgo();
        const components = splitDateTimeComponents(oneHourAgoDate);
        setDate(components.date);
        setHour(components.hour);
        setMinute(components.minute);
    };

    const setBeginningOfDay = () => {
        const beginningOfDayDate = getBeginningOfDay();
        const components = splitDateTimeComponents(beginningOfDayDate);
        setDate(components.date);
        setHour(components.hour);
        setMinute(components.minute);
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex gap-2 items-center">
                <DatePicker onChange={setDate} value={date} />
                <div className="flex gap-1 items-center">
                    <Select onValueChange={setHour} value={hour}>
                        <SelectTrigger className="w-20 h-9 px-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {hours.map((h) => (
                                <SelectItem key={h} value={h}>
                                    {h}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="text-muted-foreground text-sm">:</span>
                    <Select onValueChange={setMinute} value={minute}>
                        <SelectTrigger className="w-20 h-9 px-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {minutes.map((m) => (
                                <SelectItem key={m} value={m}>
                                    {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Quick select buttons */}
            <div className="flex gap-2">
                <Button
                    className="text-xs"
                    onClick={setOneHourAgo}
                    size="sm"
                    type="button"
                    variant="outline"
                >
                    1 hour ago
                </Button>
                <Button
                    className="text-xs"
                    onClick={setBeginningOfDay}
                    size="sm"
                    type="button"
                    variant="outline"
                >
                    Start of day
                </Button>
            </div>

            {/* Hidden input for form submission */}
            <input id={id} name={name} type="hidden" value={`${date}T${hour}:${minute}`} />
        </div>
    );
}
