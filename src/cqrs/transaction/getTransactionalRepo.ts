import type { Repository, ObjectLiteral, EntityTarget } from 'typeorm';
import { TransactionContext } from './TransactionContext';

/**
 * Returns a repository bound to the ambient transaction's QueryRunner,
 * or the original repository if no transaction context exists.
 *
 * Usage in command handlers:
 * ```typescript
 * async execute(cmd: CreateUserCommand): Promise<Result<UserDto>> {
 *   const repo = getTransactionalRepo(this.userRepo);
 *   const user = repo.create({ email: cmd.email });
 *   await repo.save(user);
 *   return Result.success(toDto(user));
 * }
 * ```
 */
export function getTransactionalRepo<T extends ObjectLiteral>(
  repo: Repository<T>,
): Repository<T> {
  const qr = TransactionContext.get();
  return qr ? qr.manager.getRepository(repo.target as EntityTarget<T>) : repo;
}
