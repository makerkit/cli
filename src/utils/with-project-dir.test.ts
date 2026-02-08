import { realpathSync } from 'fs';
import { tmpdir } from 'os';
import { describe, expect, it } from 'vitest';

import { withProjectDir } from '@/src/utils/with-project-dir';

describe('withProjectDir', () => {
  it('changes cwd to projectPath and restores on success', async () => {
    const original = process.cwd();
    const target = realpathSync(tmpdir());

    const result = await withProjectDir(target, async () => {
      expect(process.cwd()).toBe(target);
      return 'ok';
    });

    expect(result).toBe('ok');
    expect(process.cwd()).toBe(original);
  });

  it('restores cwd even when fn throws', async () => {
    const original = process.cwd();

    await expect(
      withProjectDir(realpathSync(tmpdir()), async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect(process.cwd()).toBe(original);
  });
});
