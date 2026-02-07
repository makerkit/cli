import { dirname, join } from 'path';

import { execaCommand } from 'execa';
import fs from 'fs-extra';

interface RegistryFile {
  path: string;
  content: string;
  type: string;
  target: string;
}

interface RegistryItem {
  name: string;
  files: RegistryFile[];
  dependencies?: Record<string, string>;
}

export async function installRegistryFiles(
  variant: string,
  pluginId: string,
  username: string,
): Promise<void> {
  const url = `https://makerkit.dev/r/${variant}/${pluginId}.json?username=${username}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch plugin registry for "${pluginId}" (${response.status}): ${response.statusText}`,
    );
  }

  const item: RegistryItem = await response.json();

  if (!item.files || item.files.length === 0) {
    throw new Error(`Plugin "${pluginId}" has no files in the registry.`);
  }

  const cwd = process.cwd();

  for (const file of item.files) {
    const targetPath = join(cwd, file.target);

    await fs.ensureDir(dirname(targetPath));
    await fs.writeFile(targetPath, file.content);
  }

  if (item.dependencies && Object.keys(item.dependencies).length > 0) {
    const deps = Object.entries(item.dependencies)
      .map(([name, version]) => `${name}@${version}`)
      .join(' ');

    await execaCommand(`pnpm add ${deps}`, { stdio: 'inherit' });
  }
}
