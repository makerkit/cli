import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/src/plugins-model', () => ({
  PluginRegistry: { load: vi.fn() },
  isInstalled: vi.fn(),
}));

vi.mock('@/src/utils/git', () => ({
  isGitClean: vi.fn(),
}));

vi.mock('@/src/utils/username-cache', () => ({
  getCachedUsername: vi.fn(),
}));

vi.mock('@/src/utils/workspace', () => ({
  validateProject: vi.fn(),
}));

import { isInstalled, PluginRegistry } from '@/src/plugins-model';
import { getProjectStatus } from '@/src/utils/get-project-status';
import { isGitClean } from '@/src/utils/git';
import { MOCK_PLUGIN, mocks } from '@/src/utils/test-helpers';
import { getCachedUsername } from '@/src/utils/username-cache';
import { validateProject } from '@/src/utils/workspace';

describe('getProjectStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns full project status', async () => {
    mocks.mockValidProject(validateProject);
    mocks.mockGitClean(isGitClean, true);
    mocks.mockUsername(getCachedUsername, 'testuser');
    mocks.mockPluginRegistry(PluginRegistry.load);
    vi.mocked(isInstalled).mockResolvedValue(true);

    const result = await getProjectStatus({ projectPath: '/fake' });

    expect(result).toEqual({
      variant: 'next-supabase',
      version: '1.0.0',
      gitClean: true,
      registryConfigured: true,
      plugins: [{ id: 'feedback', name: 'Feedback', installed: true }],
    });
  });

  it('returns registryConfigured false when no cached username', async () => {
    mocks.mockValidProject(validateProject);
    mocks.mockGitClean(isGitClean, false);
    mocks.mockUsername(getCachedUsername, undefined);
    mocks.mockPluginRegistry(PluginRegistry.load, { getPluginsForVariant: [] });

    const result = await getProjectStatus({ projectPath: '/fake' });

    expect(result.registryConfigured).toBe(false);
    expect(result.gitClean).toBe(false);
  });

  it('returns plugin install status', async () => {
    mocks.mockValidProject(validateProject);
    mocks.mockGitClean(isGitClean, true);
    mocks.mockUsername(getCachedUsername, 'user');
    mocks.mockPluginRegistry(PluginRegistry.load, {
      getPluginsForVariant: [
        { ...MOCK_PLUGIN, id: 'a', name: 'A' },
        { ...MOCK_PLUGIN, id: 'b', name: 'B' },
      ],
    });

    vi.mocked(isInstalled)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const result = await getProjectStatus({ projectPath: '/fake' });

    expect(result.plugins).toEqual([
      { id: 'a', name: 'A', installed: true },
      { id: 'b', name: 'B', installed: false },
    ]);
  });
});
