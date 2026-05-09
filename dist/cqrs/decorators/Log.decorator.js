"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = Log;
exports.getLogMetadata = getLogMetadata;
require("reflect-metadata");
const LOG_KEY = 'arex:log';
/**
 * @Log() — marks a command/query for automatic entry/exit logging.
 * Applied globally by PipelineExecutor when no explicit decorator is present.
 */
function Log(options = {}) {
    return (target) => {
        Reflect.defineMetadata(LOG_KEY, { logPayload: true, ...options }, target);
    };
}
function getLogMetadata(target) {
    return Reflect.getMetadata(LOG_KEY, target);
}
//# sourceMappingURL=Log.decorator.js.map