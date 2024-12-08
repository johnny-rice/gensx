export type OutputRefs<T> = {
  [K in keyof T]: string;
};

export function Outputs<TRefs>(outputs: {
  [K: string]: keyof TRefs;
}): OutputRefs<any> {
  return outputs as any;
}
