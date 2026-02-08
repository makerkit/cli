import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    writeJson: vi.fn(),
    pathExists: vi.fn(),
    readJson: vi.fn(),
  },
}));

vi.mock('@/src/version', () => ({
  CLI_VERSION: '2.0.0-test',
}));

import { readMarkerFile, writeMarkerFile } from '@/src/utils/marker-file';
import fs from 'fs-extra';

describe('writeMarkerFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates directory and writes JSON config', async () => {
    await writeMarkerFile('/project', 'next-supabase', 'makerkit/next-supabase-saas-kit-turbo');

    expect(fs.ensureDir).toHaveBeenCalledWith('/project/.makerkit');
    expect(fs.writeJson).toHaveBeenCalledWith(
      '/project/.makerkit/config.json',
      expect.objectContaining({
        version: 1,
        variant: 'next-supabase',
        kit_repo: 'makerkit/next-supabase-saas-kit-turbo',
        cli_version: '2.0.0-test',
      }),
      { spaces: 2 },
    );
  });
});

describe('readMarkerFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when file does not exist', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(false as any);

    const result = await readMarkerFile('/project');

    expect(result).toBeNull();
  });

  it('returns config when file exists', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true as any);
    vi.mocked(fs.readJson).mockResolvedValue({
      version: 1,
      variant: 'next-supabase',
      kit_repo: 'makerkit/next-supabase-saas-kit-turbo',
      created_at: '2026-01-01T00:00:00Z',
      cli_version: '2.0.0-test',
    });

    const result = await readMarkerFile('/project');

    expect(result).toEqual({
      version: 1,
      variant: 'next-supabase',
      kit_repo: 'makerkit/next-supabase-saas-kit-turbo',
      created_at: '2026-01-01T00:00:00Z',
      cli_version: '2.0.0-test',
    });
  });
});
