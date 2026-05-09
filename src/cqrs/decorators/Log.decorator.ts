import 'reflect-metadata';

const LOG_KEY = 'arex:log';

export interface LogOptions {
  /** Whether to log the command/query payload (default: true) */
  logPayload?: boolean;
}

/**
 * @Log() — marks a command/query for automatic entry/exit logging.
 * Applied globally by PipelineExecutor when no explicit decorator is present.
 */
export function Log(options: LogOptions = {}): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(LOG_KEY, { logPayload: true, ...options }, target);
  };
}

export function getLogMetadata(target: object): LogOptions | undefined {
  return Reflect.getMetadata(LOG_KEY, target);
}
