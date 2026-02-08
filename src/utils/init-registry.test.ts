import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/src/utils/workspace', () => ({
  detectVariant: vi.fn(),
}));

vi.mock('@/src/utils/username-cache', () => ({
  cacheUsername: vi.fn(),
}));

import { initRegistry } from '@/src/utils/init-registry';
import { cacheUsername } from '@/src/utils/username-cache';
import { detectVariant } from '@/src/utils/workspace';
import { mocks } from '@/src/utils/test-helpers';

describe('initRegistry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects variant, caches username, and returns result', async () => {
    mocks.mockDetectVariant(detectVariant, 'next-supabase');

    const result = await initRegistry({
      projectPath: '/fake',
      githubUsername: 'testuser',
    });

    expect(result).toEqual({
      success: true,
      variant: 'next-supabase',
      username: 'testuser',
    });

    expect(cacheUsername).toHaveBeenCalledWith('testuser');
  });
});
