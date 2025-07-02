/**
 * Transaction sequence models - main entry point.
 *
 * This module provides a clean, focused interface to the transaction sequence system
 * while keeping implementation details properly separated across focused modules.
 *
 * Guidelines Applied:
 * - Deep modules with simple interfaces: Each submodule handles a specific concern
 * - Cognitive load reduction: Clear separation between types, execution, and display
 * - Single source of truth: All exports flow through this main interface
 */

// Base implementation
export { BaseStep } from "./base-step";
// All type and interface definitions
export type {
    SequenceIntent,
    Step,
    StepDisplayInfo,
    StepExecutionContext,
    StepStatus,
    StepType,
    StepWithDisplay,
} from "./interfaces";
