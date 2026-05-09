"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCommand = validateCommand;
const Result_1 = require("../../result/Result");
/**
 * Helper: run a Zod schema against a command and return Result<void>.
 * Formats all Zod issues into a single error message.
 */
function validateCommand(schema, command) {
    const result = schema.safeParse(command);
    if (result.success) {
        return Result_1.Result.success(undefined);
    }
    const messages = result.error.issues
        .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.map(String).join('.')}: ` : '';
        return `${path}${issue.message}`;
    })
        .join('; ');
    return Result_1.Result.validationError(messages);
}
//# sourceMappingURL=ICommandValidator.js.map