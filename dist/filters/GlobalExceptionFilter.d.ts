import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
/**
 * Global exception filter that maps domain Result error types
 * and Node exceptions to RFC 7807 ProblemDetails-style JSON responses.
 */
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    private readonly isProduction;
    catch(exception: unknown, host: ArgumentsHost): void;
    private toProblemDetails;
}
//# sourceMappingURL=GlobalExceptionFilter.d.ts.map