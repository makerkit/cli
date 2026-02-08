import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/src/plugins-model', () => ({
  PluginRegistry: { load: vi.fn() },
  isInstalled: vi.fn(),
  getEnvVars: vi.fn(),
}));

vi.mock('@/src/utils/workspace', () => ({
  detectVariant: vi.fn(),
}));

import { getEnvVars, isInstalled, PluginRegistry } from '@/src/plugins-model';
import { listPlugins } from '@/src/utils/list-plugins';
import { MOCK_PLUGIN, MOCK_PLUGIN_WITH_ENV, mocks } from '@/src/utils/test-helpers';
import { detectVariant } from '@/src/utils/workspace';

describe('listPlugins', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns plugins for variant with envVars and postInstallMessage', async () => {
    mocks.mockDetectVariant(detectVariant, 'next-supabase');
    mocks.mockPluginRegistry(PluginRegistry.load, { getPluginsForVariant: [MOCK_PLUGIN_WITH_ENV] });
    vi.mocked(isInstalled).mockResolvedValue(false);
    vi.mocked(getEnvVars).mockReturnValue([
      { key: 'POSTHOG_KEY', description: 'API Key' },
    ]);

    const result = await listPlugins({ projectPath: '/fake' });

    expect(result.variant).toBe('next-supabase');
    expect(result.plugins).toEqual([
      {
        id: 'posthog',
        name: 'PostHog',
        description: 'Add PostHog Analytics',
        installed: false,
        envVars: ['POSTHOG_KEY'],
        postInstallMessage: null,
      },
    ]);
  });

  it('returns null for postInstallMessage when not set', async () => {
    mocks.mockDetectVariant(detectVariant, 'next-supabase');
    mocks.mockPluginRegistry(PluginRegistry.load, { getPluginsForVariant: [{ ...MOCK_PLUGIN, postInstallMessage: undefined }] });
    vi.mocked(isInstalled).mockResolvedValue(true);
    vi.mocked(getEnvVars).mockReturnValue([]);

    const result = await listPlugins({ projectPath: '/fake' });

    expect(result.plugins[0]!.postInstallMessage).toBeNull();
  });
});
