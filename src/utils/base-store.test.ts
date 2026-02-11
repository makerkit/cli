import { describe, expect, it } from 'vitest';

import { computeFileStatus } from '@/src/utils/base-store';

describe('computeFileStatus', () => {
  it('returns unchanged when local === remote', () => {
    expect(
      computeFileStatus({ base: 'a', local: 'b', remote: 'b' }),
    ).toBe('unchanged');
  });

  it('returns unchanged when local === remote (no base)', () => {
    expect(
      computeFileStatus({ base: undefined, local: 'x', remote: 'x' }),
    ).toBe('unchanged');
  });

  it('returns added when no base and no local', () => {
    expect(
      computeFileStatus({ base: undefined, local: undefined, remote: 'new' }),
    ).toBe('added');
  });

  it('returns no_base when no base but local exists and differs from remote', () => {
    expect(
      computeFileStatus({ base: undefined, local: 'old', remote: 'new' }),
    ).toBe('no_base');
  });

  it('returns deleted_locally when has base but no local', () => {
    expect(
      computeFileStatus({ base: 'orig', local: undefined, remote: 'updated' }),
    ).toBe('deleted_locally');
  });

  it('returns updated when base === local (user has not touched it)', () => {
    expect(
      computeFileStatus({ base: 'orig', local: 'orig', remote: 'new' }),
    ).toBe('updated');
  });

  it('returns unchanged when base === remote (remote has not changed)', () => {
    expect(
      computeFileStatus({ base: 'orig', local: 'modified', remote: 'orig' }),
    ).toBe('unchanged');
  });

  it('returns conflict when both sides changed', () => {
    expect(
      computeFileStatus({ base: 'orig', local: 'my-edit', remote: 'their-edit' }),
    ).toBe('conflict');
  });
});
