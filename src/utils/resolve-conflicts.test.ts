import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    writeFile: vi.fn(),
  },
}));

vi.mock('execa', () => ({
  execa: vi.fn(),
  execaCommand: vi.fn(),
}));

import { resolveConflicts } from '@/src/utils/resolve-conflicts';
import { execa, execaCommand } from 'execa';

describe('resolveConflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves all conflicts and commits', async () => {
    vi.mocked(execaCommand).mockResolvedValueOnce({ stdout: '' } as any);

    const result = await resolveConflicts({
      projectPath: '/fake',
      files: [
        { path: 'file-a.ts', content: 'resolved-a' },
        { path: 'file-b.ts', content: 'resolved-b' },
      ],
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.resolved).toEqual(['file-a.ts', 'file-b.ts']);
      expect(result.message).toContain('All conflicts resolved');
    }

    expect(execa).toHaveBeenCalledWith('git', ['add', 'file-a.ts', 'file-b.ts']);
    expect(execaCommand).toHaveBeenCalledWith('git commit --no-edit');
  });

  it('returns remaining conflicts when not all resolved', async () => {
    vi.mocked(execaCommand).mockResolvedValueOnce({ stdout: 'other-file.ts' } as any);

    const result = await resolveConflicts({
      projectPath: '/fake',
      files: [{ path: 'file-a.ts', content: 'resolved-a' }],
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.resolved).toEqual(['file-a.ts']);
      expect(result.remaining).toEqual(['other-file.ts']);
      expect(result.message).toContain('1 conflict(s) remain');
    }
  });

  it('uses custom commit message when provided', async () => {
    vi.mocked(execaCommand).mockResolvedValueOnce({ stdout: '' } as any);

    await resolveConflicts({
      projectPath: '/fake',
      files: [{ path: 'file-a.ts', content: 'resolved' }],
      commitMessage: 'Custom merge commit',
    });

    expect(execa).toHaveBeenCalledWith('git', ['commit', '-m', 'Custom merge commit']);
  });
});
