type WorkflowDefinition = {
  id: string;
  component: React.ReactElement;
};

const workflowRegistry = new Map<string, WorkflowDefinition>();

export function registerWorkflow(id: string, component: React.ReactElement) {
  workflowRegistry.set(id, { id, component });
}

export function getWorkflow(id: string): WorkflowDefinition | undefined {
  return workflowRegistry.get(id);
}
