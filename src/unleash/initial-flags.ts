export const FEATURE_FLAGS = {
  ENABLE_PREMIUM_MODE: 'enable-premium-mode',
  ENABLE_AGENCY_PLAN: 'enable-agency-plan',
  ENABLE_BACKLOG_GENERATION: 'enable-backlog-generation',
} as const;

export type FeatureFlagName = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];
