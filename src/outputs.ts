export type OutputRefs<T> = {
  [K in keyof T]: string;
};

export function Outputs<T>(outputs: OutputRefs<T>): OutputRefs<T> {
  return outputs;
}
