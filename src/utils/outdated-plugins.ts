import { join } from 'path';

import fs from 'fs-extra';

import {
  PluginRegistry,
  type PluginDefinition,
  getPath,
  isInstalled,
} from '@/src/plugins-model';
import { fetchRegistryItem } from '@/src/utils/install-registry-files';
import {
  cacheUsername,
  getCachedUsername,
} from '@/src/utils/username-cache';
import { validateProject } from '@/src/utils/workspace';

export interface OutdatedPluginsOptions {
  projectPath: string;
  githubUsername?: string;
}

export type OutdatedPluginsResult =
  | {
      success: true;
      variant: string;
      outdated: {
        id: string;
        name: string;
        path: string | undefined;
      }[];
    }
  | { success: false; reason: string };

async function isOutdated(
  plugin: PluginDefinition,
  variant: string,
  username: string,
  majorVersion?: number,
): Promise<boolean> {
  const item = await fetchRegistryItem(variant, plugin.id, username, majorVersion);
  const cwd = process.cwd();

  for (const file of item.files) {
    const localPath = join(cwd, file.target);

    if (!(await fs.pathExists(localPath))) {
      return true;
    }

    const localContent = await fs.readFile(localPath, 'utf-8');

    if (localContent !== file.content) {
      return true;
    }
  }

  return false;
}

export async function outdatedPlugins(
  options: OutdatedPluginsOptions,
): Promise<OutdatedPluginsResult> {
  const { variant, majorVersion } = await validateProject();

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
  const plugins = registry.getPluginsForVariant(variant);

  const installed: PluginDefinition[] = [];

  for (const p of plugins) {
    if (await isInstalled(p, variant)) {
      installed.push(p);
    }
  }

  if (installed.length === 0) {
    return { success: true, variant, outdated: [] };
  }

  const outdated: { id: string; name: string; path: string | undefined }[] = [];

  for (const plugin of installed) {
    try {
      if (await isOutdated(plugin, variant, username, majorVersion)) {
        outdated.push({
          id: plugin.id,
          name: plugin.name,
          path: getPath(plugin, variant),
        });
      }
    } catch {
      // skip plugins that fail to fetch
    }
  }

  return { success: true, variant, outdated };
}
