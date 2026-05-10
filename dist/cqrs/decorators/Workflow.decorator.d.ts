import 'reflect-metadata';
export interface WorkflowOptions {
    fallback?: 'throw' | 'skip' | 'queue';
}
export declare function Workflow(processDefinitionId: string, options?: WorkflowOptions): ClassDecorator;
export declare function getWorkflowMetadata(target: object): {
    processDefinitionId: string;
} & WorkflowOptions | undefined;
