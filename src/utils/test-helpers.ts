import { vi } from 'vitest';

import type { PluginDefinition } from '@/src/plugins-model';

export const MOCK_PLUGIN: PluginDefinition = {
  id: 'feedback',
  name: 'Feedback',
  description: 'Feedback plugin',
  variants: { 'next-supabase': { envVars: [] } },
  postInstallMessage: 'Run migrations',
};

export const MOCK_PLUGIN_WITH_ENV: PluginDefinition = {
  id: 'posthog',
  name: 'PostHog',
  description: 'Add PostHog Analytics',
  variants: {
    'next-supabase': {
      envVars: [
        { key: 'POSTHOG_KEY', description: 'API Key' },
        { key: 'POSTHOG_HOST', description: 'Host URL', defaultValue: 'https://app.posthog.com' },
      ],
    },
  },
};

/**
 * Shared mock setup helpers.
 *
 * Each method accepts the mocked module as its first arg, because the
 * `vi.mock()` declarations (and thus the mocked import bindings) live
 * in the consuming test file — not here.
 */
export const mocks = {
  mockPluginRegistry(
    PluginRegistryLoad: ReturnType<typeof vi.fn>,
    overrides?: {
      validatePlugin?: PluginDefinition;
      getPluginsForVariant?: PluginDefinition[];
    },
  ) {
    PluginRegistryLoad.mockResolvedValue({
      validatePlugin: vi.fn().mockReturnValue(overrides?.validatePlugin ?? MOCK_PLUGIN),
      getPluginsForVariant: vi.fn().mockReturnValue(overrides?.getPluginsForVariant ?? [MOCK_PLUGIN]),
      getPluginById: vi.fn().mockReturnValue(overrides?.validatePlugin ?? MOCK_PLUGIN),
    });
  },

  mockValidProject(
    validateProjectFn: ReturnType<typeof vi.fn>,
    variant: string = 'next-supabase',
    version: string = '1.0.0',
  ) {
    validateProjectFn.mockResolvedValue({ variant, version });
  },

  mockDetectVariant(
    detectVariantFn: ReturnType<typeof vi.fn>,
    variant: string = 'next-supabase',
  ) {
    detectVariantFn.mockResolvedValue(variant);
  },

  mockGitClean(
    isGitCleanFn: ReturnType<typeof vi.fn>,
    isClean: boolean = true,
  ) {
    isGitCleanFn.mockResolvedValue(isClean);
  },

  mockUsername(
    getCachedUsernameFn: ReturnType<typeof vi.fn>,
    username?: string,
  ) {
    getCachedUsernameFn.mockReturnValue(username);
  },

  mockRegistryItem(
    fetchRegistryItemFn: ReturnType<typeof vi.fn>,
    files: { path: string; content: string; type: string; target: string }[] = [],
    dependencies?: Record<string, string>,
  ) {
    fetchRegistryItemFn.mockResolvedValue({
      name: 'feedback',
      files,
      dependencies,
    });
  },

  mockInstallRegistryFiles(
    installRegistryFilesFn: ReturnType<typeof vi.fn>,
    files: { path: string; content: string; type: string; target: string }[] = [],
    dependencies?: Record<string, string>,
  ) {
    installRegistryFilesFn.mockResolvedValue({
      name: 'feedback',
      files,
      dependencies,
    });
  },
};
