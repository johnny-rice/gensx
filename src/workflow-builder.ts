type WorkflowComponent<TProps, TRefs extends Record<string, any>> = {
  (props: TProps): React.ReactElement;
  __refs: TRefs;
};

export function defineWorkflow<
  TProps extends object,
  TRefs extends Record<string, any>
>(
  refs: TRefs,
  Component: (props: TProps) => React.ReactElement
): WorkflowComponent<TProps, TRefs> {
  const WorkflowComponent = Component as WorkflowComponent<TProps, TRefs>;
  WorkflowComponent.__refs = refs;
  return WorkflowComponent;
}
