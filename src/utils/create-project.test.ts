import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn(),
  },
}));

vi.mock('execa', () => ({
  execa: vi.fn(),
}));

vi.mock('@/src/utils/marker-file', () => ({
  writeMarkerFile: vi.fn(),
}));

vi.mock('@/src/utils/upstream', () => ({
  VARIANT_REPO_MAP: {
    'next-supabase': 'makerkit/next-supabase-saas-kit-turbo',
    'next-drizzle': 'makerkit/next-drizzle-saas-kit-turbo',
    'next-prisma': 'makerkit/next-prisma-saas-kit-turbo',
    'react-router-supabase': 'makerkit/react-router-supabase-saas-kit-turbo',
  },
  hasSshAccess: vi.fn(),
}));

import { createProject } from '@/src/utils/create-project';
import { writeMarkerFile } from '@/src/utils/marker-file';
import { hasSshAccess } from '@/src/utils/upstream';
import { execa } from 'execa';
import fs from 'fs-extra';

describe('createProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when target directory already exists', async () => {
    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any);

    await expect(
      createProject({
        variant: 'next-supabase',
        name: 'my-app',
        directory: '/code',
      }),
    ).rejects.toThrow('already exists');
  });

  it('throws when parent directory does not exist', async () => {
    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(false as any)
      .mockResolvedValueOnce(false as any);

    await expect(
      createProject({
        variant: 'next-supabase',
        name: 'my-app',
        directory: '/nonexistent',
      }),
    ).rejects.toThrow('does not exist');
  });

  it('uses HTTPS with token and strips it from remote after clone', async () => {
    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(false as any)
      .mockResolvedValueOnce(true as any);

    const result = await createProject({
      variant: 'next-supabase',
      name: 'my-app',
      directory: '/code',
      githubToken: 'ghp_123',
    });

    expect(execa).toHaveBeenCalledWith(
      'git',
      ['clone', 'https://ghp_123@github.com/makerkit/next-supabase-saas-kit-turbo', 'my-app'],
      { cwd: '/code' },
    );

    expect(execa).toHaveBeenCalledWith(
      'git',
      ['remote', 'set-url', 'origin', 'https://github.com/makerkit/next-supabase-saas-kit-turbo'],
      { cwd: '/code/my-app' },
    );

    expect(result.success).toBe(true);
  });

  it('uses SSH when hasSshAccess returns true and no token', async () => {
    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(false as any)
      .mockResolvedValueOnce(true as any);
    vi.mocked(hasSshAccess).mockResolvedValue(true);

    await createProject({
      variant: 'next-supabase',
      name: 'my-app',
      directory: '/code',
    });

    expect(execa).toHaveBeenCalledWith(
      'git',
      ['clone', 'git@github.com:makerkit/next-supabase-saas-kit-turbo', 'my-app'],
      { cwd: '/code' },
    );
  });

  it('uses HTTPS when no SSH access and no token', async () => {
    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(false as any)
      .mockResolvedValueOnce(true as any);
    vi.mocked(hasSshAccess).mockResolvedValue(false);

    await createProject({
      variant: 'next-supabase',
      name: 'my-app',
      directory: '/code',
    });

    expect(execa).toHaveBeenCalledWith(
      'git',
      ['clone', 'https://github.com/makerkit/next-supabase-saas-kit-turbo', 'my-app'],
      { cwd: '/code' },
    );
  });

  it('returns success result on happy path', async () => {
    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(false as any)
      .mockResolvedValueOnce(true as any);
    vi.mocked(hasSshAccess).mockResolvedValue(true);

    const result = await createProject({
      variant: 'next-drizzle',
      name: 'my-project',
      directory: '/code',
    });

    expect(result).toEqual({
      success: true,
      projectPath: '/code/my-project',
      variant: 'next-drizzle',
      kitRepo: 'makerkit/next-drizzle-saas-kit-turbo',
      message: 'Project "my-project" created successfully with variant "next-drizzle".',
    });

    expect(writeMarkerFile).toHaveBeenCalledWith(
      '/code/my-project',
      'next-drizzle',
      'makerkit/next-drizzle-saas-kit-turbo',
    );
  });
});
