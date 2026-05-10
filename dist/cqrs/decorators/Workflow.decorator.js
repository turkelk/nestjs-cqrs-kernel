"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workflow = Workflow;
exports.getWorkflowMetadata = getWorkflowMetadata;
require("reflect-metadata");
const WORKFLOW_KEY = 'arex:workflow';
function Workflow(processDefinitionId, options) {
    return (target) => {
        Reflect.defineMetadata(WORKFLOW_KEY, { processDefinitionId, ...options }, target);
    };
}
function getWorkflowMetadata(target) {
    return Reflect.getMetadata(WORKFLOW_KEY, target);
}
