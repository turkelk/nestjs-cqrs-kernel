import 'reflect-metadata';

const WORKFLOW_KEY = 'arex:workflow';

export interface WorkflowOptions {
  fallback?: 'throw' | 'skip' | 'queue';
}

export function Workflow(
  processDefinitionId: string,
  options?: WorkflowOptions,
): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(WORKFLOW_KEY, { processDefinitionId, ...options }, target);
  };
}

export function getWorkflowMetadata(
  target: object,
): { processDefinitionId: string } & WorkflowOptions | undefined {
  return Reflect.getMetadata(WORKFLOW_KEY, target);
}
