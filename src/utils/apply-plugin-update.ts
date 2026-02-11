import { dirname, join } from 'path';

import fs from 'fs-extra';

import { PluginRegistry } from '@/src/plugins-model';
import { saveBaseVersions } from '@/src/utils/base-store';
import { fetchRegistryItem } from '@/src/utils/install-registry-files';
import {
  cacheUsername,
  getCachedUsername,
} from '@/src/utils/username-cache';
import { validateProject } from '@/src/utils/workspace';

export interface ApplyPluginUpdateOptions {
  projectPath: string;
  pluginId: string;
  files: {
    path: string;
    content?: string;
    action: 'write' | 'skip' | 'delete';
  }[];
  installDependencies?: boolean;
  githubUsername?: string;
}

export type ApplyPluginUpdateResult =
  | {
      success: true;
      pluginId: string;
      variant: string;
      written: string[];
      skipped: string[];
      deleted: string[];
    }
  | { success: false; reason: string };

export async function applyPluginUpdate(
  options: ApplyPluginUpdateOptions,
): Promise<ApplyPluginUpdateResult> {
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
  const remoteByPath = new Map(item.files.map((f) => [f.target, f.content]));

  const cwd = process.cwd();
  const written: string[] = [];
  const skipped: string[] = [];
  const deleted: string[] = [];

  for (const file of options.files) {
    const targetPath = join(cwd, file.path);

    switch (file.action) {
      case 'write': {
        if (file.content === undefined) {
          return {
            success: false,
            reason: `File "${file.path}" has action "write" but no content provided.`,
          };
        }

        await fs.ensureDir(dirname(targetPath));
        await fs.writeFile(targetPath, file.content);
        written.push(file.path);
        break;
      }
      case 'skip': {
        skipped.push(file.path);
        break;
      }
      case 'delete': {
        if (await fs.pathExists(targetPath)) {
          await fs.remove(targetPath);
        }

        deleted.push(file.path);
        break;
      }
    }

    if (file.action !== 'delete') {
      const remoteContent = remoteByPath.get(file.path);

      if (remoteContent !== undefined) {
        await saveBaseVersions(options.pluginId, [
          { path: '', content: remoteContent, type: '', target: file.path },
        ]);
      }
    }
  }

  return {
    success: true,
    pluginId: options.pluginId,
    variant,
    written,
    skipped,
    deleted,
  };
}
