import 'reflect-metadata';
export interface LogOptions {
    /** Whether to log the command/query payload (default: true) */
    logPayload?: boolean;
}
/**
 * @Log() — marks a command/query for automatic entry/exit logging.
 * Applied globally by PipelineExecutor when no explicit decorator is present.
 */
export declare function Log(options?: LogOptions): ClassDecorator;
export declare function getLogMetadata(target: object): LogOptions | undefined;
//# sourceMappingURL=Log.decorator.d.ts.map