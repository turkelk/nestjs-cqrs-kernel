export const WORKFLOW_ENGINE = Symbol('WORKFLOW_ENGINE');

export interface WorkflowStartResult {
  workflowInstanceId: string;
  processInstanceId: string;
  status: 'STARTED';
}

export interface WorkflowEngine {
  startProcess(
    processDefinitionId: string,
    command: object,
    metadata: { commandType: string; correlationId?: string },
  ): Promise<WorkflowStartResult>;

  signalProcess(processInstanceId: string, signal: string, data?: unknown): Promise<void>;

  abortProcess(processInstanceId: string): Promise<void>;
}
