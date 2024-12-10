type WorkflowComponent<TProps> = {
  (props: TProps): React.ReactElement;
};

export function defineWorkflow<TProps extends object>(
  Component: (props: TProps) => React.ReactElement
): WorkflowComponent<TProps> {
  const WorkflowComponent = ((props: TProps) => {
    return Component(props);
  }) as WorkflowComponent<TProps>;

  return WorkflowComponent;
}
