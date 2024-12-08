export type RefType<T> = { __ref: string; __type: T };

export function Ref<T>(refName: string): RefType<T> {
  return { __ref: refName, __type: null! };
}

export function isRef<T>(value: T | RefType<T>): value is RefType<T> {
  return value !== null && typeof value === "object" && "__ref" in value;
}
