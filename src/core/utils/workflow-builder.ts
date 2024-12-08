import { createRefFactory, RefType } from "../types/ref";

type WorkflowComponent<TProps, TRefs extends Record<string, any>> = {
  (props: { [K in keyof TProps]: PropOrRef<TProps[K]> }): React.ReactElement;
  __refs: TRefs;
};

type PropOrRef<T> = T | RefType<T>;

type WithRef<TProps, TRefs> = {
  [K in keyof TProps]: PropOrRef<TProps[K]>;
} & {
  Ref: <K extends keyof TRefs>(refName: K) => RefType<TRefs[K]>;
};

export function defineWorkflow<
  TProps extends object,
  TRefs extends Record<string, any>
>(
  refs: TRefs,
  Component: (props: WithRef<TProps, TRefs>) => React.ReactElement
): WorkflowComponent<TProps, TRefs> {
  const WorkflowComponent = ((props: TProps) => {
    const Ref = createRefFactory<TRefs>();
    return Component({ ...props, Ref });
  }) as WorkflowComponent<TProps, TRefs>;

  WorkflowComponent.__refs = refs;
  return WorkflowComponent;
}
