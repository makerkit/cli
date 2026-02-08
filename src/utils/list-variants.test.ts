import { describe, expect, it } from 'vitest';

import { VARIANT_REPO_MAP } from '@/src/utils/upstream';

import { listVariants, VARIANT_CATALOG } from './list-variants';

describe('listVariants', () => {
  it('returns all 4 variants', () => {
    const result = listVariants();
    expect(result.variants).toHaveLength(4);
  });

  it('wraps VARIANT_CATALOG in a variants key', () => {
    const result = listVariants();
    expect(result.variants).toBe(VARIANT_CATALOG);
  });
});

describe('VARIANT_CATALOG', () => {
  it('contains the expected variant IDs', () => {
    const ids = VARIANT_CATALOG.map((v) => v.id);

    expect(ids).toEqual([
      'next-supabase',
      'next-drizzle',
      'next-prisma',
      'react-router-supabase',
    ]);
  });

  it.each(VARIANT_CATALOG)('$id has all required fields', (variant) => {
    expect(variant.id).toBeTypeOf('string');
    expect(variant.name).toBeTypeOf('string');
    expect(variant.description).toBeTypeOf('string');
    expect(variant.repo).toBeTypeOf('string');
    expect(variant.tech).toBeInstanceOf(Array);
    expect(variant.tech.length).toBeGreaterThan(0);
    expect(variant.database).toBeTypeOf('string');
    expect(variant.auth).toBeTypeOf('string');
    expect(variant.status).toBeTypeOf('string');
  });

  it.each(VARIANT_CATALOG)('$id repo matches VARIANT_REPO_MAP', (variant) => {
    expect(variant.repo).toBe(VARIANT_REPO_MAP[variant.id]);
    expect(variant.repo).not.toBe('');
  });

  it.each(VARIANT_CATALOG)('$id has a valid status', (variant) => {
    expect(['stable', 'beta', 'deprecated']).toContain(variant.status);
  });
});
