import { join } from 'path';
import { homedir } from 'os';

import fs from 'fs-extra';

import type { PluginDefinition } from '@/src/plugins-model';

const CACHE_DIR = join(homedir(), '.makerkit');
const CACHE_FILE = join(CACHE_DIR, 'plugins.json');
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  fetchedAt: number;
  plugins: Record<string, PluginDefinition>;
}

async function readCache(): Promise<CacheEntry | null> {
  try {
    if (!(await fs.pathExists(CACHE_FILE))) {
      return null;
    }

    return await fs.readJson(CACHE_FILE);
  } catch {
    return null;
  }
}

async function writeCache(
  plugins: Record<string, PluginDefinition>,
): Promise<void> {
  try {
    await fs.ensureDir(CACHE_DIR);

    await fs.writeJson(
      CACHE_FILE,
      { fetchedAt: Date.now(), plugins },
      { spaces: 2 },
    );
  } catch {
    // Ignore cache write failures
  }
}

export async function fetchPluginRegistry(
  registryUrl: string | undefined,
  fallback: Record<string, PluginDefinition>,
): Promise<Record<string, PluginDefinition>> {
  if (!registryUrl) {
    return fallback;
  }

  // Check cache first
  const cached = await readCache();

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.plugins;
  }

  // Fetch from remote
  try {
    const response = await fetch(registryUrl);

    if (response.ok) {
      const data = await response.json();
      const plugins = data.plugins as Record<string, PluginDefinition>;

      await writeCache(plugins);

      return plugins;
    }
  } catch {
    // Network error — fall through
  }

  // Return stale cache if available, otherwise bundled fallback
  return cached?.plugins ?? fallback;
}
