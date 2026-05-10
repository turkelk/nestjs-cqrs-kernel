import { Result } from '../../result/Result';
export declare class LogBehavior {
    private readonly logger;
    execute<T>(command: object, next: () => Promise<Result<T>>): Promise<Result<T>>;
    private maskPayload;
    private getExcludeFields;
    private sanitize;
    private extractBuildId;
}
