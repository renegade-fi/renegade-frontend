# Transaction Sequence Sandbox Specification

This document is a direct copy of the spec provided in chat so that developers can reference the contracts and behaviour while working inside the `app/ramp` sandbox.  It is **not** used at runtime.

```ts
// lib/sequence/models.ts
type StepType =
  | "APPROVE"
  | "PERMIT2_SIG"
  | "WRAP"
  | "UNWRAP"
  | "BRIDGE"
  | "DEPOSIT"
  | "WITHDRAW";

// ... (rest of spec trimmed for brevity in this snippet)
``` 

## Implementation status – July 2025 sandbox

The first proof-of-concept has been built entirely under `app/ramp/`.

### What's implemented

1. **Pure-function modules**  
   * `createTokenRules()` – returns a stateless token-metadata lookup.
   * `buildSequence()` – converts a `SequenceIntent` into an ordered `TxStep[]`.

2. **Mutable domain object**  
   * `TransactionSequence` – holds steps, provides `patch/next/isComplete`.

3. **Persistence**  
   * Zustand store (`sequence-store.ts`) with `persist` middleware + `wagmi` `serialize/deserialize` for `bigint` support.  
   * Store actions: `setSequence` and `clear`.

4. **Controller**  
   * Orchestrates execution via `EvmStepRunner` (stub).  
   * Emits updates to the store, **no longer auto-clears**; UI calls `controller.reset()` when ready.

5. **React glue**  
   * `SequenceStoreProvider` supplies the zustand store.  
   * `TransactionManager` is a dumb component that renders the current steps.  
   * `page.tsx` is the sandbox page with a "Start Dummy Deposit" button.

6. **Token registry integration**  
   * `token-registry.ts` – pulls dynamic tokens from `@renegade-fi/token-nextjs` and layers on canonical main-net overrides.  
   * Exports `getTokenMeta`, the lookup used by `TransactionController`.

### Rationale for design choices

* **Functional > Class for stateless code.**  Easier unit-testing, clearer data-flow.
* **Zustand store** provides persistence, SSR safety, and composable hooks without prop-drilling.
* **Cloning in `persist()`** guarantees a new reference so zustand notifies subscribers while keeping mutation inside `TransactionSequence` simple.  An alternative is to make `TransactionSequence` fully immutable.
* **Controller doesn't clear automatically.**  Leaves UX timing to the UI, avoids flicker.

### Next steps & TODOs

1. **EvmStepRunner implementation**  
   • Inject `publicClient` / `walletClient`.  
   • Handle each `StepType` with real on-chain calls and `waitForTransactionReceipt`.

2. **Error handling / retries**  
   • Design step-level retry strategy and UI affordance.  
   • Map common RPC errors to user-friendly messages.

3. **UI polish**  
   • Replace list with a `TransactionStepper` component.  
   • Add "Clear" / "Dismiss" button that calls `controller.reset()`.

4. **Testing**  
   • Unit tests for builders and store.  
   • Integration test using a mocked runner.

5. **Docs & code comments**  
   • Document public surfaces with JSDoc.  
   • Expand this spec as modules mature.

*End of sandbox status note.* 