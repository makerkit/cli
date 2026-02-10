import {
  PluginRegistry,
  getEnvVars,
  isInstalled,
} from '@/src/plugins-model';
import { saveBaseVersions } from '@/src/utils/base-store';
import { isGitClean } from '@/src/utils/git';
import { installRegistryFiles } from '@/src/utils/install-registry-files';
import { runCodemod } from '@/src/utils/run-codemod';
import {
  cacheUsername,
  getCachedUsername,
} from '@/src/utils/username-cache';
import { validateProject } from '@/src/utils/workspace';

export interface AddPluginOptions {
  projectPath: string;
  pluginId: string;
  githubUsername?: string;
  skipGitCheck?: boolean;
  captureCodemodOutput?: boolean;
}

export type AddPluginResult =
  | {
      success: true;
      pluginName: string;
      pluginId: string;
      variant: string;
      envVars: { key: string; description: string }[];
      postInstallMessage: string | null;
      codemodOutput: string;
    }
  | { success: false; reason: string };

export async function addPlugin(
  options: AddPluginOptions,
): Promise<AddPluginResult> {
  if (!options.skipGitCheck) {
    const gitClean = await isGitClean();

    if (!gitClean) {
      return {
        success: false,
        reason:
          'Git working directory has uncommitted changes. Please commit or stash them before adding a plugin.',
      };
    }
  }

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
  const plugin = registry.validatePlugin(options.pluginId, variant);

  if (await isInstalled(plugin, variant)) {
    return {
      success: false,
      reason: `Plugin "${plugin.name}" is already installed.`,
    };
  }

  const item = await installRegistryFiles(variant, options.pluginId, username);
  await saveBaseVersions(options.pluginId, item.files);

  const codemodResult = await runCodemod(variant, options.pluginId, {
    captureOutput: options.captureCodemodOutput ?? true,
  });

  if (!codemodResult.success) {
    return {
      success: false,
      reason: `Plugin installation failed during codemod.\n${codemodResult.output}\nTo revert: git checkout . && git clean -fd`,
    };
  }

  const envVars = getEnvVars(plugin, variant);

  return {
    success: true,
    pluginName: plugin.name,
    pluginId: plugin.id,
    variant,
    envVars: envVars.map((e) => ({ key: e.key, description: e.description })),
    postInstallMessage: plugin.postInstallMessage ?? null,
    codemodOutput: codemodResult.output,
  };
}
