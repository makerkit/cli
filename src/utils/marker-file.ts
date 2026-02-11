import { join } from 'path';

import fs from 'fs-extra';

import { CLI_VERSION } from '@/src/version';

export interface MakerkitProjectConfig {
  version: number;
  variant: string;
  kit_repo: string;
  created_at: string;
  cli_version: string;
}

export async function writeMarkerFile(
  projectPath: string,
  variant: string,
  kitRepo: string,
): Promise<void> {
  const dir = join(projectPath, '.makerkit');

  await fs.ensureDir(dir);

  const config: MakerkitProjectConfig = {
    version: 1,
    variant,
    kit_repo: kitRepo,
    created_at: new Date().toISOString(),
    cli_version: CLI_VERSION,
  };

  await fs.writeJson(join(dir, 'config.json'), config, { spaces: 2 });
}

export async function readMarkerFile(
  projectPath: string,
): Promise<MakerkitProjectConfig | null> {
  const filePath = join(projectPath, '.makerkit', 'config.json');

  if (!(await fs.pathExists(filePath))) {
    return null;
  }

  return fs.readJson(filePath);
}
