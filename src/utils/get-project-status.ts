import {
  PluginRegistry,
  isInstalled,
} from '@/src/plugins-model';
import { isGitClean } from '@/src/utils/git';
import { getCachedUsername } from '@/src/utils/username-cache';
import { validateProject } from '@/src/utils/workspace';

export interface GetProjectStatusOptions {
  projectPath: string;
}

export interface GetProjectStatusResult {
  variant: string;
  version: string;
  gitClean: boolean;
  registryConfigured: boolean;
  plugins: { id: string; name: string; installed: boolean }[];
}

export async function getProjectStatus(
  options: GetProjectStatusOptions,
): Promise<GetProjectStatusResult> {
  const { variant, version } = await validateProject();
  const gitClean = await isGitClean();
  const registryConfigured = !!getCachedUsername();
  const registry = await PluginRegistry.load();
  const plugins = registry.getPluginsForVariant(variant);

  const pluginStatuses = await Promise.all(
    plugins.map(async (p) => ({
      id: p.id,
      name: p.name,
      installed: await isInstalled(p, variant),
    })),
  );

  return {
    variant,
    version,
    gitClean,
    registryConfigured,
    plugins: pluginStatuses,
  };
}
