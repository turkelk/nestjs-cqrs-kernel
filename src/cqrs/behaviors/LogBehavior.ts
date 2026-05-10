import { Injectable, Logger } from '@nestjs/common';
import { Result, ErrorType } from '../../result/Result';
import { correlationStore } from '../../middleware/CorrelationStore';

const PII_FIELDS = new Set(['email', 'githubAccessToken', 'accessToken', 'token', 'secretKey', 'password']);
const MAX_STRING_LENGTH = 200;
const MAX_ARRAY_LENGTH = 5;
const MAX_DEPTH = 2;

@Injectable()
export class LogBehavior {
  private readonly logger = new Logger('PipelineBehavior');

  async execute<T>(command: object, next: () => Promise<Result<T>>): Promise<Result<T>> {
    const commandName = command.constructor.name;
    const startTime = Date.now();
    const ctx = correlationStore.getStore();

    const logContext = {
      command: commandName,
      correlationId: ctx?.correlationId,
      userId: ctx?.userId,
      orgId: ctx?.organizationId,
      ...(this.extractBuildId(command)),
      payload: this.maskPayload(command),
    };

    try {
      const result = await next();
      const durationMs = Date.now() - startTime;

      if (result.isSuccess) {
        this.logger.log({
          msg: `${commandName} completed`,
          ...logContext,
          durationMs,
          result: 'success',
        });
      } else {
        this.logger.warn({
          msg: `${commandName} completed`,
          ...logContext,
          durationMs,
          result: 'failure',
          errorType: result.errorType ?? 'Unknown',
          errorMessage: result.errorMessage,
        });
      }

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error({
        msg: `${commandName} failed`,
        ...logContext,
        durationMs,
        result: 'exception',
        error: err.message,
        stack: err.stack,
      });
      return Result.failure(ErrorType.InternalError, err.message);
    }
  }

  private maskPayload(command: object): Record<string, unknown> {
    const excludeFields = this.getExcludeFields(command);
    return this.sanitize(command, 0, excludeFields) as Record<string, unknown>;
  }

  private getExcludeFields(command: object): Set<string> {
    const ctor = command.constructor as { logExclude?: string[] };
    return new Set(ctor.logExclude ?? []);
  }

  private sanitize(value: unknown, depth: number, excludeFields?: Set<string>): unknown {
    if (value === null || value === undefined) return value;

    if (typeof value === 'string') {
      return value.length > MAX_STRING_LENGTH
        ? `${value.substring(0, MAX_STRING_LENGTH)}... (${value.length} chars)`
        : value;
    }

    if (typeof value !== 'object') return value;

    if (depth >= MAX_DEPTH) return '[nested]';

    if (Array.isArray(value)) {
      if (value.length > MAX_ARRAY_LENGTH) {
        return [
          ...value.slice(0, MAX_ARRAY_LENGTH).map((v) => this.sanitize(v, depth + 1)),
          `... +${value.length - MAX_ARRAY_LENGTH} more`,
        ];
      }
      return value.map((v) => this.sanitize(v, depth + 1));
    }

    const masked: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (excludeFields?.has(key)) {
        masked[key] = '[excluded]';
      } else if (PII_FIELDS.has(key)) {
        if (key === 'email' && typeof val === 'string') {
          const [local, domain] = val.split('@');
          masked[key] = domain ? `${local?.[0]}***@${domain}` : '[REDACTED]';
        } else {
          masked[key] = '[REDACTED]';
        }
      } else {
        masked[key] = this.sanitize(val, depth + 1);
      }
    }
    return masked;
  }

  private extractBuildId(command: object): { buildId?: string } {
    const buildId = (command as Record<string, unknown>)['buildId'];
    return typeof buildId === 'string' ? { buildId } : {};
  }
}
