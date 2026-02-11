import { dirname, join } from 'path';
import fs from 'fs-extra';

export interface RegistryFile {
  path: string;
  content: string;
  type: string;
  target: string;
}

export interface RegistryItem {
  name: string;
  files: RegistryFile[];
  dependencies?: Record<string, string>;
}

export async function fetchRegistryItem(
  variant: string,
  pluginId: string,
  username: string,
): Promise<RegistryItem> {
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

  return item;
}

export async function installRegistryFiles(
  variant: string,
  pluginId: string,
  username: string,
): Promise<RegistryItem> {
  const item = await fetchRegistryItem(variant, pluginId, username);
  const cwd = process.cwd();

  for (const file of item.files) {
    const targetPath = join(cwd, file.target);

    await fs.ensureDir(dirname(targetPath));
    await fs.writeFile(targetPath, file.content);
  }

  return item;
}
