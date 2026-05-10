import { WorkflowEngine } from '../interfaces/WorkflowEngine';
import { Result } from '../../result/Result';
export declare class WorkflowBehavior {
    private readonly engine?;
    private readonly logger;
    constructor(engine?: WorkflowEngine | undefined);
    execute<T>(command: object, next: () => Promise<Result<T>>, context?: Map<string, unknown>): Promise<Result<T>>;
}
