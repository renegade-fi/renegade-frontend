## Basic deposit flow

With the primitives in place you can now perform a minimal deposit:

```ts
const ctx: TaskContext = /* build from your React hook or backend */

const driver = new TaskDriver();

// 1. ERC20 approval (if required)
await driver.runTask(
  ApproveTask.create(chainId, mint, amount, sdkCfg.permit2Address as `0x${string}`, ctx),
);

// 2. Permit2 witness signature
await driver.runTask(Permit2SigTask.create(chainId, mint, amount, ctx));

// 3. Renegade deposit
await driver.runTask(DepositTask.create(chainId, mint, amount, ctx));
```

Each task drives its own state machine and blocks until `completed() === true`. 