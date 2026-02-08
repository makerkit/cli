import { dirname, join } from 'path';

import fs from 'fs-extra';

import type { RegistryFile } from '@/src/utils/install-registry-files';

export type FileStatus =
  | 'unchanged'
  | 'updated'
  | 'conflict'
  | 'added'
  | 'deleted_locally'
  | 'no_base';

function basesDir(pluginId: string): string {
  return join(process.cwd(), 'node_modules', '.cache', 'makerkit', 'bases', pluginId);
}

export async function saveBaseVersions(
  pluginId: string,
  files: RegistryFile[],
): Promise<void> {
  const dir = basesDir(pluginId);

  for (const file of files) {
    const targetPath = join(dir, file.target);

    await fs.ensureDir(dirname(targetPath));
    await fs.writeFile(targetPath, file.content);
  }
}

export async function readBaseVersion(
  pluginId: string,
  fileTarget: string,
): Promise<string | undefined> {
  const filePath = join(basesDir(pluginId), fileTarget);

  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return undefined;
  }
}

export async function hasBaseVersions(pluginId: string): Promise<boolean> {
  return fs.pathExists(basesDir(pluginId));
}

export function computeFileStatus(params: {
  base?: string;
  local?: string;
  remote: string;
}): FileStatus {
  const { base, local, remote } = params;

  // Local matches remote — nothing to do regardless of base
  if (local !== undefined && local === remote) {
    return 'unchanged';
  }

  // No base version (legacy install or new file)
  if (base === undefined) {
    if (local === undefined) {
      return 'added';
    }

    return 'no_base';
  }

  // Has base version
  if (local === undefined) {
    return 'deleted_locally';
  }

  if (base === local) {
    // User hasn't touched the file — safe auto-apply
    return 'updated';
  }

  if (base === remote) {
    // Remote hasn't changed — local edits are fine
    return 'unchanged';
  }

  // Both sides changed
  return 'conflict';
}
