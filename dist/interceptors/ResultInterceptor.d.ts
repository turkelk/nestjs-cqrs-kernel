import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class ResultInterceptor implements NestInterceptor {
    private readonly logger;
    intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
//# sourceMappingURL=ResultInterceptor.d.ts.map