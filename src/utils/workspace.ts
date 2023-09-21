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
      version: packageJson.version,
    };
  }

  static async logWorkspaceInfo() {
    const meta = await Workspace.getKitMeta();

    console.log(
      `Makerkit version: ${chalk.cyan(meta.name)} - ${chalk.cyan(
        meta.version
      )}.\n`
    );
  }
}

async function detectKitVersion() {
  const packageJson = await getPackageJson();

  if (!packageJson) {
    throw new Error(
      'No package.json found. Please run this command in a Makerkit workspace.'
    );
  }

  const deps = Object.keys(packageJson.dependencies ?? []);

  if (deps.includes('next') && deps.includes('firebase')) {
    return KitsModel.NextJsFirebase;
  }

  if (deps.includes('next') && deps.includes('@supabase/supabase-js')) {
    return KitsModel.NextJsSupabase;
  }

  if (deps.includes('@remix-run/react') && deps.includes('firebase')) {
    return KitsModel.NextJsSupabaseLite;
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
