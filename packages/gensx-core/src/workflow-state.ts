/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */
import { getCurrentContext } from "./context.js";
import * as fastJsonPatch from "./utils/fast-json-patch/index.js";

// Define JSON Patch operation types based on RFC 6902
interface BaseOperation {
  path: string;
}

interface AddOperation<T> extends BaseOperation {
  op: "add";
  value: T;
}

interface RemoveOperation extends BaseOperation {
  op: "remove";
}

interface ReplaceOperation<T> extends BaseOperation {
  op: "replace";
  value: T;
}

interface MoveOperation extends BaseOperation {
  op: "move";
  from: string;
}

interface CopyOperation extends BaseOperation {
  op: "copy";
  from: string;
}

interface TestOperation<T> extends BaseOperation {
  op: "test";
  value: T;
}

interface GetOperation<T> extends BaseOperation {
  op: "_get";
  value: T;
}

type JsonPatchOperation =
  | AddOperation<JsonValue>
  | RemoveOperation
  | ReplaceOperation<JsonValue>
  | MoveOperation
  | CopyOperation
  | TestOperation<JsonValue>
  | GetOperation<JsonValue>;

// JSON-serializable value type for progress data
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// Extended operation types for optimized string handling
export interface StringAppendOperation {
  op: "string-append";
  path: string;
  value: string;
}

// Combined operation type including standard JSON Patch and our extensions
export type Operation = JsonPatchOperation | StringAppendOperation;

// Individual message types
export interface StartMessage {
  type: "start";
  workflowExecutionId?: string;
  workflowName: string;
}

export interface ComponentStartMessage {
  type: "component-start";
  componentName: string;
  label?: string;
  componentId: string;
}

export interface ComponentEndMessage {
  type: "component-end";
  componentName: string;
  label?: string;
  componentId: string;
}

export interface DataMessage {
  type: "data";
  data: JsonValue;
}

export interface EventMessage {
  type: "event";
  data: JsonValue;
  label: string;
}

export interface ObjectMessage {
  type: "object";
  label: string;
  patches: Operation[];
  isInitial?: boolean;
}

export interface ErrorMessage {
  type: "error";
  error: string;
}

export interface EndMessage {
  type: "end";
}

export interface ExternalToolMessage {
  type: "external-tool";
  toolName: string;
  params: JsonValue;
  paramsSchema: unknown;
  resultSchema: unknown;
  nodeId: string;
}

// Union of all message types
export type WorkflowMessage =
  | StartMessage
  | ComponentStartMessage
  | ComponentEndMessage
  | DataMessage
  | EventMessage
  | ObjectMessage
  | ErrorMessage
  | EndMessage
  | ExternalToolMessage;

export type WorkflowMessageListener = (message: WorkflowMessage) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PublishableData = any;

/**
 * Publish data to the workflow message stream. This is a low-level utility for putting arbitrary data on the stream.
 *
 * @param data - The data to publish.
 */
export function publishData(data: JsonValue) {
  const context = getCurrentContext();
  context.getWorkflowContext().sendWorkflowMessage({
    type: "data",
    data,
  });
}

/**
 * Publish an event to the workflow message stream. Labels group events together, and generally all events within the same label should be related with the same type.
 *
 * @param label - The label of the event.
 * @param data - The data to publish.
 */
export function publishEvent<T = PublishableData>(label: string, data: T) {
  const context = getCurrentContext();
  context.getWorkflowContext().sendWorkflowMessage({
    type: "event",
    label,
    data: data as PublishableData,
  });
}

/**
 * Publish a state to the workflow message stream. A State represents a snapshot of an object that is updated over time.
 * This now uses JSON patches to efficiently send only the differences between states.
 *
 * @param label - The label of the state.
 * @param data - The data to publish. Can be any value that can be serialized to JSON .
 */
export function publishObject<T = JsonValue>(label: string, data: T) {
  const context = getCurrentContext();
  const workflowContext = context.getWorkflowContext();

  // Deep clone the data to avoid mutations affecting the ability to diff
  const newData = JSON.parse(JSON.stringify(data)) as JsonValue;
  const previousData = workflowContext.objectStateMap.get(label);

  if (previousData === undefined) {
    // First time publishing this object
    let patches: Operation[];
    if (isPlainObject(newData)) {
      // Use RFC 6902 add patches for each property
      patches = fastJsonPatch.compare({}, newData);
    } else {
      // For primitives/arrays, use a root-level replace
      patches = [{ op: "replace", path: "", value: newData }];
    }
    workflowContext.sendWorkflowMessage({
      type: "object",
      label,
      patches,
      isInitial: true,
    });
  } else {
    // Generate optimized patches from previous state to new state
    const patches = generateOptimizedPatches(previousData, newData);

    // Only send message if there are changes
    if (patches.length > 0) {
      workflowContext.sendWorkflowMessage({
        type: "object",
        label,
        patches,
      });
    }
  }

  // Store the new state
  workflowContext.objectStateMap.set(label, newData);
}

/**
 * Generate optimized patches that use string-specific operations when beneficial.
 * Handles any JsonValue at the root, including string-append optimization for root strings.
 */
export function generateOptimizedPatches(
  oldData: PublishableData,
  newData: PublishableData,
): Operation[] {
  // Handle root-level string-append optimization
  if (typeof oldData === "string" && typeof newData === "string") {
    if (newData.startsWith(oldData)) {
      const appendedText = newData.slice(oldData.length);
      if (appendedText.length > 0) {
        return [{ op: "string-append", path: "", value: appendedText }];
      }
    }
    // If not an append, just replace
    if (oldData !== newData) {
      return [{ op: "replace", path: "", value: newData }];
    }
    return [];
  }

  // If either is not a plain object, use a single replace patch at the root
  if (!isPlainObject(oldData) || !isPlainObject(newData)) {
    if (oldData !== newData) {
      return [{ op: "replace", path: "", value: newData }];
    }
    return [];
  }

  // Both are plain objects: use standard patching and string-append optimization for properties
  const standardPatches = fastJsonPatch.compare(oldData, newData);
  const optimizedPatches: Operation[] = [];

  // Collect all parent paths that are being added/replaced
  const parentPaths = new Set(
    standardPatches
      .filter((patch) => patch.op === "add" || patch.op === "replace")
      .map((patch) => patch.path),
  );

  for (const patch of standardPatches) {
    // If this patch's path is a child of any parent path, skip it
    if (
      Array.from(parentPaths).some(
        (parent) => parent !== "" && patch.path.startsWith(parent + "/"),
      )
    ) {
      continue;
    }
    if (patch.op === "replace" && typeof patch.value === "string") {
      // Check if this is a string replacement that could be optimized
      const oldValue = getValueByJsonPath(oldData, patch.path);
      if (typeof oldValue === "string") {
        const newValue = patch.value;
        // Check if it's a simple append (common in streaming scenarios)
        if (newValue.startsWith(oldValue)) {
          const appendedText = newValue.slice(oldValue.length);
          if (appendedText.length > 0) {
            optimizedPatches.push({
              op: "string-append",
              path: patch.path,
              value: appendedText,
            });
            continue;
          }
        }
      }
    }
    // Use standard patch if no optimization applies
    optimizedPatches.push(patch);
  }

  return optimizedPatches;
}

/**
 * Utility to check if a value is a non-null, non-array object
 */
function isPlainObject(val: unknown): val is Record<string, JsonValue> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

/**
 * Get a value from an object using a JSON pointer path (RFC 6901 compliant, supports arrays)
 */
export function getValueByJsonPath(
  obj: JsonValue,
  path: string,
): JsonValue | undefined {
  if (path === "") {
    return obj;
  }
  const pathParts = path.split("/").slice(1); // Remove empty first element
  let current: JsonValue = obj;

  for (const part of pathParts) {
    if (Array.isArray(current)) {
      // Try to parse as array index
      const idx = Number(part);
      if (!Number.isNaN(idx) && idx >= 0 && idx < current.length) {
        current = current[idx];
      } else {
        return undefined;
      }
    } else if (isPlainObject(current)) {
      if (part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Create a function that publishes an event to the workflow message stream with the given label.
 *
 * @param label - The label of the event.
 * @returns A function that publishes an event to the workflow message stream.
 */
export function createEventStream<T = PublishableData>(label: string) {
  return (data: T) => {
    publishEvent(label, data);
  };
}

/**
 * Create a function that publishes a state to the workflow message stream with the given label.
 *
 * @param label - The label of the state.
 * @returns A function that publishes a state to the workflow message stream.
 */
export function createObjectStream<T extends JsonValue = JsonValue>(
  label: string,
) {
  return (data: T) => {
    publishObject(label, data);
  };
}

/**
 * Clear stored state for a given label. This is useful when starting a new workflow execution.
 *
 * @param label - The label of the state to clear.
 */
export function clearObjectState(label: string) {
  const context = getCurrentContext();
  context.getWorkflowContext().objectStateMap.delete(label);
}

/**
 * Clear all stored object states. This is useful when starting a new workflow execution.
 */
export function clearAllObjectStates() {
  const context = getCurrentContext();
  context.getWorkflowContext().objectStateMap.clear();
}

/**
 * Apply a JSON patch to reconstruct object state. This is useful for consumers who want to reconstruct the full object state from patches.
 *
 * @param patches - The JSON patch operations to apply.
 * @param currentState - The current state of the object (defaults to empty object).
 * @returns The new state after applying the patches.
 */
export function applyObjectPatches(
  patches: Operation[],
  currentState: PublishableData = {},
): PublishableData {
  let document = fastJsonPatch.deepClone(currentState);

  let standardPatches: fastJsonPatch.Operation[] = [];
  for (const operation of patches) {
    if (operation.op === "string-append") {
      // Handle string append operation
      if (operation.path === "") {
        // Root-level string append
        if (typeof document === "string") {
          document = document + operation.value;
        } else {
          // Warn and skip instead of throwing or replacing
          console.warn(
            `Cannot apply string-append: root value is not a string. Skipping operation.`,
          );
          // Do nothing
        }
        continue;
      }
      const pathParts = operation.path.split("/").slice(1); // Remove empty first element
      const target = getValueByPath(document, pathParts.slice(0, -1));
      const property = pathParts[pathParts.length - 1];

      if (typeof target === "object" && target !== null) {
        const currentValue = (target as Record<string, JsonValue>)[property];
        if (typeof currentValue === "string") {
          (target as Record<string, JsonValue>)[property] =
            currentValue + operation.value;
        } else {
          // Warn and skip instead of replacing
          console.warn(
            `Cannot apply string-append: target path '${operation.path}' is not a string. Skipping operation.`,
          );
          // Do nothing
        }
      } else {
        // Warn and skip instead of throwing
        console.warn(
          `Cannot apply string-append: target path '${operation.path}' does not exist or is not an object. Skipping operation.`,
        );
        // Do nothing
      }
    } else {
      // Handle standard JSON Patch operations
      standardPatches.push(operation);
    }
  }

  if (standardPatches.length > 0) {
    const result = fastJsonPatch.applyPatch(
      document,
      fastJsonPatch.deepClone(standardPatches) as fastJsonPatch.Operation[],
    );
    return result.newDocument;
  }

  return document;
}

/**
 * Helper function to get a value by path in an object or array (RFC 6901 compliant)
 */
function getValueByPath(obj: PublishableData, path: string[]): PublishableData {
  let current: PublishableData = obj;
  for (const segment of path) {
    if (Array.isArray(current)) {
      const idx = Number(segment);
      if (!Number.isNaN(idx) && idx >= 0 && idx < current.length) {
        current = current[idx];
      } else {
        return undefined;
      }
    } else if (isPlainObject(current)) {
      if (segment in current) {
        current = current[segment];
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }
  return current;
}
