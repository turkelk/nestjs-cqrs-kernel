import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { correlationStore } from './CorrelationStore';

const CORRELATION_ID_HEADER = 'X-Correlation-ID';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void): void {
    const correlationId =
      (req.headers[CORRELATION_ID_HEADER.toLowerCase()] as string) || uuidv4();

    req.correlationId = correlationId;
    req.headers[CORRELATION_ID_HEADER.toLowerCase()] = correlationId;
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    const storeData = {
      correlationId,
      userId: req.user?.keycloakId,
      organizationId: req.user?.organizationId,
    };

    correlationStore.run(storeData, () => {
      next();
    });
  }
}
