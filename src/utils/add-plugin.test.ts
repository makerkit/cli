import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/src/plugins-model', () => ({
  PluginRegistry: { load: vi.fn() },
  isInstalled: vi.fn(),
  getEnvVars: vi.fn(),
}));

vi.mock('@/src/utils/git', () => ({
  isGitClean: vi.fn(),
}));

vi.mock('@/src/utils/workspace', () => ({
  validateProject: vi.fn(),
}));

vi.mock('@/src/utils/username-cache', () => ({
  getCachedUsername: vi.fn(),
  cacheUsername: vi.fn(),
}));

vi.mock('@/src/utils/install-registry-files', () => ({
  installRegistryFiles: vi.fn(),
}));

vi.mock('@/src/utils/base-store', () => ({
  saveBaseVersions: vi.fn(),
}));

vi.mock('@/src/utils/run-codemod', () => ({
  runCodemod: vi.fn(),
}));

vi.mock('@/src/utils/env-vars', () => ({
  appendEnvVars: vi.fn(),
}));

import { getEnvVars, isInstalled, PluginRegistry } from '@/src/plugins-model';
import { addPlugin } from '@/src/utils/add-plugin';
import { saveBaseVersions } from '@/src/utils/base-store';
import { appendEnvVars } from '@/src/utils/env-vars';
import { isGitClean } from '@/src/utils/git';
import { installRegistryFiles } from '@/src/utils/install-registry-files';
import { runCodemod } from '@/src/utils/run-codemod';
import { MOCK_PLUGIN, mocks } from '@/src/utils/test-helpers';
import { cacheUsername, getCachedUsername } from '@/src/utils/username-cache';
import { validateProject } from '@/src/utils/workspace';

describe('addPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns failure when git is dirty', async () => {
    mocks.mockGitClean(isGitClean, false);

    const result = await addPlugin({ projectPath: '/fake', pluginId: 'feedback' });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.reason).toContain('uncommitted changes');
    }
  });

  it('returns failure when no username', async () => {
    mocks.mockGitClean(isGitClean, true);
    mocks.mockValidProject(validateProject);
    mocks.mockUsername(getCachedUsername, undefined);

    const result = await addPlugin({ projectPath: '/fake', pluginId: 'feedback' });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.reason).toContain('No GitHub username');
    }
  });

  it('returns failure when plugin already installed', async () => {
    mocks.mockGitClean(isGitClean, true);
    mocks.mockValidProject(validateProject);
    mocks.mockUsername(getCachedUsername, 'user');
    mocks.mockPluginRegistry(PluginRegistry.load, { validatePlugin: MOCK_PLUGIN });
    vi.mocked(isInstalled).mockResolvedValue(true);

    const result = await addPlugin({ projectPath: '/fake', pluginId: 'feedback' });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.reason).toContain('already installed');
    }
  });

  it('returns success with warning when codemod fails', async () => {
    mocks.mockGitClean(isGitClean, true);
    mocks.mockValidProject(validateProject);
    mocks.mockUsername(getCachedUsername, 'user');
    mocks.mockPluginRegistry(PluginRegistry.load, { validatePlugin: MOCK_PLUGIN });
    vi.mocked(isInstalled).mockResolvedValue(false);
    mocks.mockInstallRegistryFiles(installRegistryFiles);
    vi.mocked(runCodemod).mockResolvedValue({ success: false, output: 'codemod error' });
    vi.mocked(getEnvVars).mockReturnValue([]);

    const result = await addPlugin({ projectPath: '/fake', pluginId: 'feedback' });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.codemodWarning).toBeDefined();
      expect(result.codemodWarning).toContain('codemod');
    }
  });

  it('succeeds with env vars on happy path', async () => {
    mocks.mockGitClean(isGitClean, true);
    mocks.mockValidProject(validateProject);
    mocks.mockUsername(getCachedUsername, 'user');
    mocks.mockPluginRegistry(PluginRegistry.load, { validatePlugin: MOCK_PLUGIN });
    vi.mocked(isInstalled).mockResolvedValue(false);
    mocks.mockInstallRegistryFiles(installRegistryFiles, [{ path: 'a', content: 'b', type: 'file', target: 'c' }]);
    vi.mocked(runCodemod).mockResolvedValue({ success: true, output: 'done' });
    vi.mocked(getEnvVars).mockReturnValue([
      { key: 'FEEDBACK_KEY', description: 'Key' },
    ]);

    const result = await addPlugin({
      projectPath: '/fake',
      pluginId: 'feedback',
      githubUsername: 'newuser',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.pluginName).toBe('Feedback');
      expect(result.envVars).toEqual([{ key: 'FEEDBACK_KEY', description: 'Key' }]);
      expect(result.postInstallMessage).toBe('Run migrations');
    }

    expect(cacheUsername).toHaveBeenCalledWith('newuser');
    expect(saveBaseVersions).toHaveBeenCalled();
  });

  it('skips git check when skipGitCheck is true', async () => {
    mocks.mockGitClean(isGitClean, false);
    mocks.mockValidProject(validateProject);
    mocks.mockUsername(getCachedUsername, 'user');
    mocks.mockPluginRegistry(PluginRegistry.load, { validatePlugin: MOCK_PLUGIN });
    vi.mocked(isInstalled).mockResolvedValue(false);
    mocks.mockInstallRegistryFiles(installRegistryFiles);
    vi.mocked(runCodemod).mockResolvedValue({ success: true, output: 'done' });
    vi.mocked(getEnvVars).mockReturnValue([]);

    const result = await addPlugin({
      projectPath: '/fake',
      pluginId: 'feedback',
      skipGitCheck: true,
    });

    expect(result.success).toBe(true);
    expect(isGitClean).not.toHaveBeenCalled();
  });
});
