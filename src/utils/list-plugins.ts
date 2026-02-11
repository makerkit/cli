import {
  PluginRegistry,
  getEnvVars,
  isInstalled,
} from '@/src/plugins-model';
import { detectVariant } from '@/src/utils/workspace';

export interface ListPluginsOptions {
  projectPath: string;
}

export interface ListPluginsResult {
  variant: string;
  plugins: {
    id: string;
    name: string;
    description: string;
    installed: boolean;
    envVars: string[];
    postInstallMessage: string | null;
  }[];
}

export async function listPlugins(
  options: ListPluginsOptions,
): Promise<ListPluginsResult> {
  const variant = await detectVariant();
  const registry = await PluginRegistry.load();
  const plugins = registry.getPluginsForVariant(variant);

  const pluginList = await Promise.all(
    plugins.map(async (p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      installed: await isInstalled(p, variant),
      envVars: getEnvVars(p, variant).map((e) => e.key),
      postInstallMessage: p.postInstallMessage ?? null,
    })),
  );

  return { variant, plugins: pluginList };
}
