import { join } from 'path';

import fs from 'fs-extra';

const MANIFEST_FILENAME = '.makerkit-plugins.json';

export interface PluginManifestEntry {
  pluginId: string;
  version: string;
  variant: string;
  installedAt: string;
  source?: string;
}

export interface PluginManifest {
  plugins: PluginManifestEntry[];
}

function getManifestPath(): string {
  return join(process.cwd(), MANIFEST_FILENAME);
}

export async function readManifest(): Promise<PluginManifest> {
  const manifestPath = getManifestPath();

  if (!(await fs.pathExists(manifestPath))) {
    return { plugins: [] };
  }

  return fs.readJson(manifestPath);
}

export async function writeManifest(manifest: PluginManifest): Promise<void> {
  const manifestPath = getManifestPath();

  await fs.writeJson(manifestPath, manifest, { spaces: 2 });
}

export async function isPluginInstalled(pluginId: string): Promise<boolean> {
  const manifest = await readManifest();

  return manifest.plugins.some((p) => p.pluginId === pluginId);
}

export async function addPluginToManifest(
  pluginId: string,
  version: string,
  variant: string,
  source?: string,
): Promise<void> {
  const manifest = await readManifest();

  const existing = manifest.plugins.findIndex((p) => p.pluginId === pluginId);

  const entry: PluginManifestEntry = {
    pluginId,
    version,
    variant,
    installedAt: new Date().toISOString(),
    ...(source ? { source } : {}),
  };

  if (existing >= 0) {
    manifest.plugins[existing] = entry;
  } else {
    manifest.plugins.push(entry);
  }

  await writeManifest(manifest);
}
