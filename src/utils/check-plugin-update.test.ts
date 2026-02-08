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
  hasBaseVersions: vi.fn(),
  readBaseVersion: vi.fn(),
  computeFileStatus: vi.fn(),
}));

vi.mock('fs-extra', () => ({
  default: {
    readFile: vi.fn(),
  },
}));

import { PluginRegistry } from '@/src/plugins-model';
import { computeFileStatus, hasBaseVersions, readBaseVersion } from '@/src/utils/base-store';
import { checkPluginUpdate } from '@/src/utils/check-plugin-update';
import { fetchRegistryItem } from '@/src/utils/install-registry-files';
import { mocks } from '@/src/utils/test-helpers';
import { getCachedUsername } from '@/src/utils/username-cache';
import { validateProject } from '@/src/utils/workspace';
import fs from 'fs-extra';

describe('checkPluginUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns failure when no username', async () => {
    mocks.mockValidProject(validateProject);
    mocks.mockUsername(getCachedUsername, undefined);

    const result = await checkPluginUpdate({
      projectPath: '/fake',
      pluginId: 'feedback',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.reason).toContain('No GitHub username');
    }
  });

  it('returns mixed statuses with correct counts', async () => {
    mocks.mockValidProject(validateProject);
    mocks.mockUsername(getCachedUsername, 'user');
    mocks.mockPluginRegistry(PluginRegistry.load);
    mocks.mockRegistryItem(fetchRegistryItem, [
      { path: 'a', content: 'remote-a', type: 'file', target: 'file-a.ts' },
      { path: 'b', content: 'remote-b', type: 'file', target: 'file-b.ts' },
      { path: 'c', content: 'remote-c', type: 'file', target: 'file-c.ts' },
    ]);
    vi.mocked(hasBaseVersions).mockResolvedValue(true);

    vi.mocked(fs.readFile)
      .mockResolvedValueOnce('local-a' as any)
      .mockResolvedValueOnce('local-b' as any)
      .mockRejectedValueOnce(new Error('ENOENT'));

    vi.mocked(readBaseVersion)
      .mockResolvedValueOnce('base-a')
      .mockResolvedValueOnce('base-b')
      .mockResolvedValueOnce('base-c');

    vi.mocked(computeFileStatus)
      .mockReturnValueOnce('conflict')
      .mockReturnValueOnce('updated')
      .mockReturnValueOnce('deleted_locally');

    const result = await checkPluginUpdate({
      projectPath: '/fake',
      pluginId: 'feedback',
      githubUsername: 'user',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.counts).toEqual({
        unchanged: 0,
        updated: 1,
        conflict: 1,
        added: 0,
        deleted_locally: 1,
        no_base: 0,
      });

      expect(result.files).toHaveLength(3);

      const conflict = result.files.find((f) => f.status === 'conflict');
      expect(conflict?.base).toBe('base-a');
      expect(conflict?.local).toBe('local-a');
      expect(conflict?.remote).toBe('remote-a');

      const updated = result.files.find((f) => f.status === 'updated');
      expect(updated?.remote).toBe('remote-b');
      expect(updated?.base).toBeUndefined();

      const deleted = result.files.find((f) => f.status === 'deleted_locally');
      expect(deleted?.base).toBe('base-c');
      expect(deleted?.remote).toBe('remote-c');
    }
  });
});
