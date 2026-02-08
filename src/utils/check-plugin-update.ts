import { join } from 'path';

import fs from 'fs-extra';

import { PluginRegistry } from '@/src/plugins-model';
import {
  computeFileStatus,
  hasBaseVersions,
  readBaseVersion,
} from '@/src/utils/base-store';
import { fetchRegistryItem } from '@/src/utils/install-registry-files';
import {
  cacheUsername,
  getCachedUsername,
} from '@/src/utils/username-cache';
import { validateProject } from '@/src/utils/workspace';

export interface CheckPluginUpdateOptions {
  projectPath: string;
  pluginId: string;
  githubUsername?: string;
}

export type CheckPluginUpdateResult =
  | {
      success: true;
      pluginId: string;
      variant: string;
      hasBaseVersions: boolean;
      counts: Record<string, number>;
      files: {
        path: string;
        status: string;
        base?: string;
        local?: string;
        remote?: string;
      }[];
    }
  | { success: false; reason: string };

export async function checkPluginUpdate(
  options: CheckPluginUpdateOptions,
): Promise<CheckPluginUpdateResult> {
  const { variant } = await validateProject();

  const username = options.githubUsername?.trim() || getCachedUsername();

  if (!username) {
    return {
      success: false,
      reason:
        'No GitHub username cached and none provided. Call makerkit_init_registry first or pass githubUsername.',
    };
  }

  cacheUsername(username);

  const registry = await PluginRegistry.load();
  registry.validatePlugin(options.pluginId, variant);

  const item = await fetchRegistryItem(variant, options.pluginId, username);
  const cwd = process.cwd();
  const hasBase = await hasBaseVersions(options.pluginId);

  const counts: Record<string, number> = {
    unchanged: 0,
    updated: 0,
    conflict: 0,
    added: 0,
    deleted_locally: 0,
    no_base: 0,
  };

  const files = await Promise.all(
    item.files.map(async (file) => {
      const localPath = join(cwd, file.target);

      let local: string | undefined;

      try {
        local = await fs.readFile(localPath, 'utf-8');
      } catch {
        local = undefined;
      }

      const base = await readBaseVersion(options.pluginId, file.target);
      const remote = file.content;

      const status = computeFileStatus({ base, local, remote });
      counts[status]++;

      const result: {
        path: string;
        status: string;
        base?: string;
        local?: string;
        remote?: string;
      } = {
        path: file.target,
        status,
      };

      switch (status) {
        case 'unchanged':
          break;
        case 'updated':
          result.remote = remote;
          break;
        case 'conflict':
          result.base = base;
          result.local = local;
          result.remote = remote;
          break;
        case 'no_base':
          result.local = local;
          result.remote = remote;
          break;
        case 'added':
          result.remote = remote;
          break;
        case 'deleted_locally':
          result.base = base;
          result.remote = remote;
          break;
      }

      return result;
    }),
  );

  return {
    success: true,
    pluginId: options.pluginId,
    variant,
    hasBaseVersions: hasBase,
    counts,
    files,
  };
}
