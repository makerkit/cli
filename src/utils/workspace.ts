import { join } from 'path';
import { KitsModel } from '@/src/kits-model';
import chalk from 'chalk';
import fs from 'fs-extra';

export class Workspace {
  static async getKitMeta() {
    const packageJson = await getPackageJson();
    const kit = await detectKitVersion();

    return {
      ...kit,
      version: packageJson.version ?? 'unknown',
    };
  }

  static async logWorkspaceInfo() {
    const meta = await Workspace.getKitMeta();

    console.log(
      `Makerkit version: ${chalk.cyan(meta.name)} - ${chalk.cyan(
        meta.version ?? 'unknown'
      )}.\n`
    );
  }
}

async function detectKitVersion() {
  let packageJson = await getPackageJson();

  if (!packageJson) {
    throw new Error(
      'No package.json found. Please run this command in a Makerkit workspace.'
    );
  }

  let deps = Object.keys(packageJson.dependencies ?? []);

  if (deps.length === 0) {
    deps = Object.keys(packageJson.devDependencies ?? []);
  }

  if (deps.includes('turbo')) {
    // locate apps/web
    packageJson = await fs.readJSON(
      join(process.cwd(), 'apps/web/package.json')
    );

    deps = Object.keys(packageJson.dependencies ?? []);

    if (deps.includes('next')) {
      return KitsModel.NextJsSupabaseTurbo;
    }

    if (deps.includes('@remix-run/react')) {
      return KitsModel.RemixSupabaseTurbo;
    }
  }

  if (deps.includes('next') && deps.includes('firebase')) {
    return KitsModel.NextJsFirebase;
  }

  if (deps.includes('next') && deps.includes('@supabase/supabase-js')) {
    return KitsModel.NextJsSupabase;
  }

  if (
    deps.includes('@remix-run/react') &&
    deps.includes('@supabase/supabase-js')
  ) {
    return KitsModel.RemixSupabase;
  }

  throw new Error(
    'Could not detect Makerkit workspace. Please run this command in a Makerkit workspace.'
  );
}

async function getPackageJson(): Promise<Record<string, unknown>> {
  return fs
    .readJSON(join(process.cwd(), 'package.json'))
    .catch(() => undefined);
}
