"use server";

import { cookies } from "next/headers";

export async function setCookie(name: string, value: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(name, value, {
        path: "/",
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
    });
}

export async function getCookie(name: string): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value ?? null;
}

export async function removeCookie(name: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(name);
}
