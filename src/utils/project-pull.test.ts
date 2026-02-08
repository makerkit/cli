import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/src/utils/workspace', () => ({
  validateProject: vi.fn(),
}));

vi.mock('@/src/utils/git', () => ({
  isGitClean: vi.fn(),
  getErrorOutput: vi.fn(),
}));

vi.mock('@/src/utils/upstream', () => ({
  getUpstreamRemoteUrl: vi.fn(),
  getUpstreamUrl: vi.fn(),
  hasSshAccess: vi.fn(),
  isUpstreamUrlValid: vi.fn(),
  setUpstreamRemote: vi.fn(),
}));

vi.mock('execa', () => ({
  execaCommand: vi.fn(),
  execa: vi.fn(),
}));

vi.mock('fs-extra', () => ({
  default: {
    readFile: vi.fn(),
  },
}));

import { getErrorOutput, isGitClean } from '@/src/utils/git';
import { projectPull } from '@/src/utils/project-pull';
import { mocks } from '@/src/utils/test-helpers';
import { validateProject } from '@/src/utils/workspace';
import {
  getUpstreamRemoteUrl,
  getUpstreamUrl,
  hasSshAccess,
  isUpstreamUrlValid,
  setUpstreamRemote,
} from '@/src/utils/upstream';
import { execa, execaCommand } from 'execa';
import fs from 'fs-extra';

describe('projectPull', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockValidProject(validateProject);
  });

  it('returns failure when git is dirty', async () => {
    mocks.mockGitClean(isGitClean, false);

    const result = await projectPull({ projectPath: '/fake' });

    expect(result.success).toBe(false);

    if (result.success === false && 'reason' in result) {
      expect(result.reason).toContain('uncommitted changes');
    }
  });

  it('configures upstream remote with SSH when SSH access available', async () => {
    mocks.mockGitClean(isGitClean, true);
    vi.mocked(getUpstreamRemoteUrl).mockResolvedValue(undefined);
    vi.mocked(hasSshAccess).mockResolvedValue(true);
    vi.mocked(getUpstreamUrl).mockReturnValue('git@github.com:makerkit/next-supabase-saas-kit-turbo');
    vi.mocked(execaCommand)
      .mockResolvedValueOnce(undefined as any)
      .mockResolvedValueOnce({ stdout: 'Already up to date.' } as any);

    const result = await projectPull({ projectPath: '/fake' });

    expect(setUpstreamRemote).toHaveBeenCalledWith('git@github.com:makerkit/next-supabase-saas-kit-turbo');
    expect(result.success).toBe(true);
  });

  it('configures upstream remote with HTTPS when no SSH', async () => {
    mocks.mockGitClean(isGitClean, true);
    vi.mocked(getUpstreamRemoteUrl).mockResolvedValue(undefined);
    vi.mocked(hasSshAccess).mockResolvedValue(false);
    vi.mocked(getUpstreamUrl).mockReturnValue('https://github.com/makerkit/next-supabase-saas-kit-turbo');
    vi.mocked(execaCommand)
      .mockResolvedValueOnce(undefined as any)
      .mockResolvedValueOnce({ stdout: 'Already up to date.' } as any);

    const result = await projectPull({ projectPath: '/fake' });

    expect(setUpstreamRemote).toHaveBeenCalledWith('https://github.com/makerkit/next-supabase-saas-kit-turbo');
    expect(result.success).toBe(true);
  });

  it('returns error when upstream URL is invalid', async () => {
    mocks.mockGitClean(isGitClean, true);
    vi.mocked(getUpstreamRemoteUrl).mockResolvedValue('https://github.com/wrong/repo');
    vi.mocked(isUpstreamUrlValid).mockReturnValue(false);
    vi.mocked(getUpstreamUrl).mockReturnValue('https://github.com/makerkit/next-supabase-saas-kit-turbo');

    const result = await projectPull({ projectPath: '/fake' });

    expect(result.success).toBe(false);

    if (result.success === false && 'reason' in result) {
      expect(result.reason).toContain('Upstream remote points to');
    }
  });

  it('returns success on clean merge', async () => {
    mocks.mockGitClean(isGitClean, true);
    vi.mocked(getUpstreamRemoteUrl).mockResolvedValue('git@github.com:makerkit/next-supabase-saas-kit-turbo');
    vi.mocked(isUpstreamUrlValid).mockReturnValue(true);
    vi.mocked(execaCommand)
      .mockResolvedValueOnce(undefined as any)
      .mockResolvedValueOnce({ stdout: 'Merge made by the \'ort\' strategy.' } as any);

    const result = await projectPull({ projectPath: '/fake' });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.alreadyUpToDate).toBe(false);
      expect(result.message).toContain('Successfully merged');
    }
  });

  it('returns already up to date', async () => {
    mocks.mockGitClean(isGitClean, true);
    vi.mocked(getUpstreamRemoteUrl).mockResolvedValue('git@github.com:makerkit/next-supabase-saas-kit-turbo');
    vi.mocked(isUpstreamUrlValid).mockReturnValue(true);
    vi.mocked(execaCommand)
      .mockResolvedValueOnce(undefined as any)
      .mockResolvedValueOnce({ stdout: 'Already up to date.' } as any);

    const result = await projectPull({ projectPath: '/fake' });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.alreadyUpToDate).toBe(true);
    }
  });

  it('returns conflict details on merge conflicts', async () => {
    mocks.mockGitClean(isGitClean, true);
    vi.mocked(getUpstreamRemoteUrl).mockResolvedValue('git@github.com:makerkit/next-supabase-saas-kit-turbo');
    vi.mocked(isUpstreamUrlValid).mockReturnValue(true);

    const mergeError = new Error('merge failed');
    vi.mocked(getErrorOutput).mockReturnValue('CONFLICT (content): merge conflict in file.ts\nAutomatic merge failed');

    vi.mocked(execaCommand)
      .mockResolvedValueOnce(undefined as any)
      .mockRejectedValueOnce(mergeError)
      .mockResolvedValueOnce({ stdout: 'file.ts' } as any);

    vi.mocked(fs.readFile).mockResolvedValue('<<<< HEAD\nours\n====\ntheirs\n>>>>' as any);

    vi.mocked(execa)
      .mockResolvedValueOnce({ stdout: 'base-content' } as any)
      .mockResolvedValueOnce({ stdout: 'ours-content' } as any)
      .mockResolvedValueOnce({ stdout: 'theirs-content' } as any);

    const result = await projectPull({ projectPath: '/fake' });

    expect(result.success).toBe(false);

    if (!result.success && 'hasConflicts' in result) {
      expect(result.hasConflicts).toBe(true);
      expect(result.conflictCount).toBe(1);
      expect(result.conflicts[0]!.path).toBe('file.ts');
      expect(result.conflicts[0]!.base).toBe('base-content');
      expect(result.conflicts[0]!.ours).toBe('ours-content');
      expect(result.conflicts[0]!.theirs).toBe('theirs-content');
    }
  });
});
