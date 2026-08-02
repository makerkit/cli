import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn(),
    readJson: vi.fn(),
  },
}));

import {
  type PluginDefinition,
  getPaths,
  isInstalled,
  isTrackable,
} from '@/src/plugins-model';
import fs from 'fs-extra';

const SINGLE_PATH: PluginDefinition = {
  id: 'feedback',
  name: 'Feedback',
  description: 'Feedback plugin',
  variants: {
    'next-supabase': { envVars: [], path: 'packages/plugins/feedback' },
  },
};

const MULTI_PATH: PluginDefinition = {
  id: 'expo',
  name: 'Expo Mobile App',
  description: 'Add an Expo mobile app',
  selfDistributing: true,
  variants: {
    'next-supabase': {
      envVars: [],
      path: 'packages/mobile-ui',
      paths: ['packages/mobile-ui', 'apps/native', 'apps/web/app/api/v1'],
    },
  },
};

/** Marks `present` as existing on disk and everything else as missing. */
function mockDisk(present: string[]) {
  vi.mocked(fs.pathExists).mockImplementation(((path: string) =>
    Promise.resolve(
      present.some((p) => path.endsWith(p)),
    )) as unknown as typeof fs.pathExists);
}

describe('getPaths', () => {
  it('falls back to the single path when paths is absent', () => {
    expect(getPaths(SINGLE_PATH, 'next-supabase')).toEqual([
      'packages/plugins/feedback',
    ]);
  });

  it('returns every owned directory when paths is set', () => {
    expect(getPaths(MULTI_PATH, 'next-supabase')).toEqual([
      'packages/mobile-ui',
      'apps/native',
      'apps/web/app/api/v1',
    ]);
  });

  it('returns an empty list for a variant with no path', () => {
    const plugin: PluginDefinition = {
      ...SINGLE_PATH,
      variants: { 'next-supabase': { envVars: [] } },
    };

    expect(getPaths(plugin, 'next-supabase')).toEqual([]);
  });
});

describe('isTrackable', () => {
  it('is true for registry-backed plugins', () => {
    expect(isTrackable(SINGLE_PATH)).toBe(true);
  });

  it('is false for self-distributing plugins', () => {
    expect(isTrackable(MULTI_PATH)).toBe(false);
  });
});

describe('isInstalled', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(fs.readJson).mockResolvedValue({
      name: '@kit/mobile-ui',
      exports: { '.': './src/index.ts' },
    });
  });

  it('is true for a single-path plugin whose package is present', async () => {
    mockDisk(['packages/plugins/feedback/package.json']);

    await expect(isInstalled(SINGLE_PATH, 'next-supabase')).resolves.toBe(true);
  });

  it('is false when the package.json is missing', async () => {
    mockDisk([]);

    await expect(isInstalled(SINGLE_PATH, 'next-supabase')).resolves.toBe(false);
  });

  it('is false when the package.json has no exports', async () => {
    mockDisk(['packages/plugins/feedback/package.json']);
    vi.mocked(fs.readJson).mockResolvedValue({ name: 'feedback' });

    await expect(isInstalled(SINGLE_PATH, 'next-supabase')).resolves.toBe(false);
  });

  it('is true for a multi-path plugin when every directory is present', async () => {
    mockDisk([
      'packages/mobile-ui/package.json',
      'apps/native',
      'apps/web/app/api/v1',
    ]);

    await expect(isInstalled(MULTI_PATH, 'next-supabase')).resolves.toBe(true);
  });

  it('is false when the app half of a multi-path plugin was removed', async () => {
    // The detection package survives, so a `path`-only check would wrongly
    // report this half-removed plugin as installed and refuse to reinstall it.
    mockDisk(['packages/mobile-ui/package.json', 'apps/web/app/api/v1']);

    await expect(isInstalled(MULTI_PATH, 'next-supabase')).resolves.toBe(false);
  });

  it('is false when the API routes are missing', async () => {
    mockDisk(['packages/mobile-ui/package.json', 'apps/native']);

    await expect(isInstalled(MULTI_PATH, 'next-supabase')).resolves.toBe(false);
  });
});
