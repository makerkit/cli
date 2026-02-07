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
