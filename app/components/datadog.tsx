"use client";

import React from "react";

import { env } from "@/env/client";

export function LazyDatadog() {
    React.useEffect(() => {
        if (
            process.env.NODE_ENV === "development" ||
            env.NEXT_PUBLIC_VERCEL_ENV === "development"
        ) {
            return;
        }

        let datadogRum: any;
        let datadogLogs;

        async function loadLogging() {
            const datadogRumModule = await import("@datadog/browser-rum");
            const datadogLogsModule = await import("@datadog/browser-logs");

            datadogRum = datadogRumModule.datadogRum;
            datadogLogs = datadogLogsModule.datadogLogs;

            datadogRum.init({
                applicationId: env.NEXT_PUBLIC_DATADOG_APPLICATION_ID,
                clientToken: env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN,
                defaultPrivacyLevel: "allow",
                env: "testnet",
                service: "testnet-interface",
                sessionReplaySampleRate: 100,
                sessionSampleRate: 100,
                site: "us5.datadoghq.com",
                startSessionReplayRecordingManually: true,
                trackLongTasks: true,
                trackResources: true,
                trackUserInteractions: true,
                version: "1.0.0",
            });

            datadogLogs.init({
                clientToken: env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN,
                env: "testnet",
                forwardConsoleLogs: "all",
                forwardErrorsToLogs: true,
                service: "testnet-interface",
                sessionSampleRate: 100,
                site: "us5.datadoghq.com",
            });

            datadogRum.startSessionReplayRecording();
        }

        loadLogging();

        return () => {
            if (datadogRum) {
                datadogRum.stopSessionReplayRecording();
            }
        };
    }, []);

    return null;
}
