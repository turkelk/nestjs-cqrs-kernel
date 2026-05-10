import { Result } from '../../result/Result';
/**
 * Interface for Zod-based command/query validators.
 *
 * Each command that needs validation gets a separate validator class
 * with a Zod schema. The `@Validate(ValidatorClass)` decorator links
 * the command to its validator.
 *
 * Usage:
 * ```typescript
 * export class BlockUserValidator implements ICommandValidator<BlockUserCommand> {
 *   schema = z.object({
 *     blockerId: z.string().uuid(),
 *     blockedUserId: z.string().uuid(),
 *   }).refine(d => d.blockerId !== d.blockedUserId, 'Cannot block yourself');
 *
 *   validate(command: BlockUserCommand): Result<void> {
 *     return validateCommand(this.schema, command);
 *   }
 * }
 * ```
 */
export interface ICommandValidator<T = any> {
    validate(command: T): Result<void>;
}
/**
 * A schema that can safeParse — matches Zod's ZodType without importing it.
 * This avoids Zod v3/v4 compatibility issues across packages.
 */
interface SafeParseable {
    safeParse(data: unknown): {
        success: true;
    } | {
        success: false;
        error: {
            issues: Array<{
                path: PropertyKey[];
                message: string;
            }>;
        };
    };
}
/**
 * Helper: run a Zod schema against a command and return Result<void>.
 * Formats all Zod issues into a single error message.
 */
export declare function validateCommand(schema: SafeParseable, command: unknown): Result<void>;
export {};
