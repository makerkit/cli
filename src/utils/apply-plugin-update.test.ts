import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/src/plugins-model', () => ({
  PluginRegistry: { load: vi.fn() },
}));

vi.mock('@/src/utils/workspace', () => ({
  validateProject: vi.fn(),
}));

vi.mock('@/src/utils/username-cache', () => ({
  getCachedUsername: vi.fn(),
  cacheUsername: vi.fn(),
}));

vi.mock('@/src/utils/install-registry-files', () => ({
  fetchRegistryItem: vi.fn(),
}));

vi.mock('@/src/utils/base-store', () => ({
  saveBaseVersions: vi.fn(),
}));

vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    writeFile: vi.fn(),
    pathExists: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('execa', () => ({
  execaCommand: vi.fn(),
}));

import { PluginRegistry } from '@/src/plugins-model';
import { applyPluginUpdate } from '@/src/utils/apply-plugin-update';
import { saveBaseVersions } from '@/src/utils/base-store';
import { fetchRegistryItem } from '@/src/utils/install-registry-files';
import { mocks } from '@/src/utils/test-helpers';
import { getCachedUsername } from '@/src/utils/username-cache';
import { validateProject } from '@/src/utils/workspace';
import { execaCommand } from 'execa';
import fs from 'fs-extra';

describe('applyPluginUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupCommon(deps?: Record<string, string>) {
    mocks.mockValidProject(validateProject);
    mocks.mockUsername(getCachedUsername, 'user');
    mocks.mockPluginRegistry(PluginRegistry.load);
    mocks.mockRegistryItem(
      fetchRegistryItem,
      [
        { path: 'a', content: 'remote-a', type: 'file', target: 'file-a.ts' },
        { path: 'b', content: 'remote-b', type: 'file', target: 'file-b.ts' },
        { path: 'c', content: 'remote-c', type: 'file', target: 'file-c.ts' },
      ],
      deps,
    );
  }

  it('handles write/skip/delete actions', async () => {
    setupCommon();
    vi.mocked(fs.pathExists).mockResolvedValue(true as any);

    const result = await applyPluginUpdate({
      projectPath: '/fake',
      pluginId: 'feedback',
      files: [
        { path: 'file-a.ts', content: 'merged-a', action: 'write' },
        { path: 'file-b.ts', action: 'skip' },
        { path: 'file-c.ts', action: 'delete' },
      ],
      installDependencies: false,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.written).toEqual(['file-a.ts']);
      expect(result.skipped).toEqual(['file-b.ts']);
      expect(result.deleted).toEqual(['file-c.ts']);
      expect(result.dependenciesInstalled).toBe(false);
    }

    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.remove).toHaveBeenCalled();
    expect(saveBaseVersions).toHaveBeenCalledTimes(2);
  });

  it('returns failure when write action has no content', async () => {
    mocks.mockValidProject(validateProject);
    mocks.mockUsername(getCachedUsername, 'user');
    mocks.mockPluginRegistry(PluginRegistry.load);
    mocks.mockRegistryItem(fetchRegistryItem, [{ path: 'a', content: 'remote-a', type: 'file', target: 'file-a.ts' }]);

    const result = await applyPluginUpdate({
      projectPath: '/fake',
      pluginId: 'feedback',
      files: [{ path: 'file-a.ts', action: 'write' }],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.reason).toContain('no content provided');
    }
  });

  it('installs dependencies when present', async () => {
    setupCommon({ 'some-pkg': '1.0.0' });

    const result = await applyPluginUpdate({
      projectPath: '/fake',
      pluginId: 'feedback',
      files: [],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.dependenciesInstalled).toBe(true);
    }

    expect(execaCommand).toHaveBeenCalledWith('pnpm add some-pkg@1.0.0', { stdio: 'pipe' });
  });

  it('skips dependency install when installDependencies is false', async () => {
    setupCommon({ 'some-pkg': '1.0.0' });

    const result = await applyPluginUpdate({
      projectPath: '/fake',
      pluginId: 'feedback',
      files: [],
      installDependencies: false,
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.dependenciesInstalled).toBe(false);
    }

    expect(execaCommand).not.toHaveBeenCalled();
  });
});
