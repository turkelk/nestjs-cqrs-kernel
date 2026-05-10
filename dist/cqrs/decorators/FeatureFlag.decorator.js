"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlag = FeatureFlag;
exports.getFeatureFlagMetadata = getFeatureFlagMetadata;
require("reflect-metadata");
const FEATURE_FLAG_KEY = 'arex:feature-flag';
function FeatureFlag(flagName, options = { fallback: 'throw' }) {
    return (target) => {
        Reflect.defineMetadata(FEATURE_FLAG_KEY, { flagName, ...options }, target);
    };
}
function getFeatureFlagMetadata(target) {
    return Reflect.getMetadata(FEATURE_FLAG_KEY, target);
}
