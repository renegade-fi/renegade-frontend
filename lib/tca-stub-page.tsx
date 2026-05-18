import { notFound } from "next/navigation";

// Build-time stub used in TCA-only builds. next.config.mjs replaces every
// non-/tca, non-/api page module with this file via webpack
// NormalModuleReplacementPlugin. Defense in depth on top of middleware:
// even if middleware fails open, the page itself unconditionally 404s.
export default function TcaStubPage(): never {
    notFound();
}
