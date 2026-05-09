"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactionalRepo = getTransactionalRepo;
const TransactionContext_1 = require("./TransactionContext");
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
function getTransactionalRepo(repo) {
    const qr = TransactionContext_1.TransactionContext.get();
    return qr ? qr.manager.getRepository(repo.target) : repo;
}
//# sourceMappingURL=getTransactionalRepo.js.map