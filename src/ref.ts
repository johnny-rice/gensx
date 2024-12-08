export type RefType<T> = { __ref: string; __type: T };

export function isRef<T>(value: unknown): value is RefType<T> {
  return typeof value === "object" && value !== null && "__ref" in value;
}

export function Ref<T>(refName: string): RefType<T> {
  return { __ref: refName, __type: null! };
}

export function getComponentRefs<T extends Record<string, any>>(component: {
  __refs?: T;
}): T {
  if (!component.__refs) {
    throw new Error("Component does not define refs");
  }
  return component.__refs;
}
