import { join } from 'path';

import fs from 'fs-extra';

export type Variant =
  | 'next-supabase'
  | 'next-drizzle'
  | 'next-prisma'
  | 'react-router-supabase'
  | 'tanstack-supabase'
  | 'tanstack-drizzle'
  | 'tanstack-prisma';

async function readDeps(
  pkgPath: string,
): Promise<Record<string, string>> {
  if (!(await fs.pathExists(pkgPath))) {
    return {};
  }

  const pkg = await fs.readJson(pkgPath);

  return {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };
}

export async function detectVariant(): Promise<Variant> {
  const cwd = process.cwd();

  const rootPkgPath = join(cwd, 'package.json');

  if (!(await fs.pathExists(rootPkgPath))) {
    throw new Error(
      'No package.json found. Please run this command from a MakerKit project root.',
    );
  }

  const rootDeps = await readDeps(rootPkgPath);

  if (!rootDeps['turbo']) {
    throw new Error(
      'This does not appear to be a MakerKit Turbo monorepo. The "turbo" dependency was not found in package.json.',
    );
  }

  const webDeps = await readDeps(join(cwd, 'apps', 'web', 'package.json'));
  const dbDeps = await readDeps(
    join(cwd, 'packages', 'database', 'package.json'),
  );

  const hasSupabase = !!webDeps['@supabase/supabase-js'];
  const hasReactRouter = !!webDeps['@react-router/node'];
  const hasTanstack = !!webDeps['@tanstack/react-start'];
  const hasDrizzle = !!webDeps['drizzle-orm'] || !!dbDeps['drizzle-orm'];
  const hasPrisma = !!webDeps['@prisma/client'] || !!dbDeps['@prisma/client'];

  // TanStack Start kits must be checked before the plain Next.js branches:
  // the TanStack Supabase kit ships both @supabase/supabase-js and
  // @tanstack/react-start, so a naive hasSupabase check would misclassify it.
  if (hasTanstack) {
    if (hasSupabase) {
      return 'tanstack-supabase';
    }

    if (hasDrizzle) {
      return 'tanstack-drizzle';
    }

    if (hasPrisma) {
      return 'tanstack-prisma';
    }
  }

  if (hasReactRouter && hasSupabase) {
    return 'react-router-supabase';
  }

  if (hasSupabase) {
    return 'next-supabase';
  }

  if (hasDrizzle) {
    return 'next-drizzle';
  }

  if (hasPrisma) {
    return 'next-prisma';
  }

  throw new Error(
    'Unrecognized MakerKit project. Could not detect variant from dependencies.',
  );
}

export async function validateProject(): Promise<{
  variant: Variant;
  version: string;
  majorVersion: number | undefined;
}> {
  const variant = await detectVariant();
  const rootPkg = await fs.readJson(join(process.cwd(), 'package.json'));
  const version: string = rootPkg.version ?? 'unknown';
  const major = parseInt(version.split('.')[0], 10);

  return {
    variant,
    version,
    majorVersion: isNaN(major) ? undefined : major,
  };
}
