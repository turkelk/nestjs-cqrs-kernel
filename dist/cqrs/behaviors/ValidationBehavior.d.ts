import { Result } from '../../result/Result';
export declare class ValidationBehavior {
    execute<T>(command: object, next: () => Promise<Result<T>>): Promise<Result<T>>;
}
//# sourceMappingURL=ValidationBehavior.d.ts.map