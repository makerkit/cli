import { describe, expect, it } from 'vitest';

import { getErrorOutput } from '@/src/utils/git';

describe('getErrorOutput', () => {
  it('extracts stderr from execa-style error', () => {
    const error = Object.assign(new Error('Command failed'), {
      stderr: 'merge conflict detected',
    });

    expect(getErrorOutput(error)).toBe('merge conflict detected');
  });

  it('falls back to stdout when stderr is empty', () => {
    const error = Object.assign(new Error('Command failed'), {
      stderr: '',
      stdout: 'CONFLICT (content): merge conflict in file.ts',
    });

    expect(getErrorOutput(error)).toBe(
      'CONFLICT (content): merge conflict in file.ts',
    );
  });

  it('falls back to error.message when both stderr and stdout are empty', () => {
    const error = Object.assign(new Error('Something went wrong'), {
      stderr: '',
      stdout: '',
    });

    expect(getErrorOutput(error)).toBe('Something went wrong');
  });

  it('returns error.message for plain Error', () => {
    const error = new Error('plain error');

    expect(getErrorOutput(error)).toBe('plain error');
  });

  it('returns string for non-Error values', () => {
    expect(getErrorOutput('string error')).toBe('string error');
  });

  it('returns stringified number', () => {
    expect(getErrorOutput(42)).toBe('42');
  });
});
