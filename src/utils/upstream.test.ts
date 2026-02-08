import { describe, expect, it } from 'vitest';

import { getUpstreamUrl, isUpstreamUrlValid } from '@/src/utils/upstream';

describe('getUpstreamUrl', () => {
  it('returns SSH URL when useSsh is true', () => {
    const url = getUpstreamUrl('next-supabase', true);
    expect(url).toBe('git@github.com:makerkit/next-supabase-saas-kit-turbo');
  });

  it('returns HTTPS URL when useSsh is false', () => {
    const url = getUpstreamUrl('next-supabase', false);
    expect(url).toBe('https://github.com/makerkit/next-supabase-saas-kit-turbo');
  });

  it('returns correct URL for react-router-supabase', () => {
    expect(getUpstreamUrl('react-router-supabase', false)).toBe(
      'https://github.com/makerkit/react-router-supabase-saas-kit-turbo',
    );
  });
});

describe('isUpstreamUrlValid', () => {
  it('validates SSH URL', () => {
    expect(
      isUpstreamUrlValid(
        'git@github.com:makerkit/next-supabase-saas-kit-turbo',
        'next-supabase',
      ),
    ).toBe(true);
  });

  it('validates HTTPS URL', () => {
    expect(
      isUpstreamUrlValid(
        'https://github.com/makerkit/next-supabase-saas-kit-turbo',
        'next-supabase',
      ),
    ).toBe(true);
  });

  it('validates URL with trailing .git', () => {
    expect(
      isUpstreamUrlValid(
        'https://github.com/makerkit/next-supabase-saas-kit-turbo.git',
        'next-supabase',
      ),
    ).toBe(true);
  });

  it('validates URL with trailing slash', () => {
    expect(
      isUpstreamUrlValid(
        'https://github.com/makerkit/next-supabase-saas-kit-turbo/',
        'next-supabase',
      ),
    ).toBe(true);
  });

  it('rejects wrong repo URL', () => {
    expect(
      isUpstreamUrlValid(
        'https://github.com/makerkit/next-drizzle-saas-kit-turbo',
        'next-supabase',
      ),
    ).toBe(false);
  });

  it('rejects arbitrary URL', () => {
    expect(
      isUpstreamUrlValid(
        'https://github.com/other/repo',
        'next-supabase',
      ),
    ).toBe(false);
  });
});
