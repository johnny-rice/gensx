export type RefType<T> = { __ref: string; __type: T };

export function isRef<T>(value: unknown): value is RefType<T> {
  return typeof value === "object" && value !== null && "__ref" in value;
}

export function Ref<T>(refName: string): RefType<T> {
  return { __ref: refName, __type: null! };
}

export function createRefFactory<TRefs extends Record<string, any>>() {
  return function Ref<K extends keyof TRefs>(refName: K): RefType<TRefs[K]> {
    return { __ref: refName as string, __type: null! };
  };
}
