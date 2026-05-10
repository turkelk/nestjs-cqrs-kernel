import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
/**
 * Global exception filter for framework-level exceptions (guards, pipes, throttler).
 * Result<T> errors are handled by ResultInterceptor — they never reach this filter.
 */
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    private readonly isProduction;
    catch(exception: unknown, host: ArgumentsHost): void;
    private toProblemDetails;
}
//# sourceMappingURL=GlobalExceptionFilter.d.ts.map