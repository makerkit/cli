import { join } from 'path';

import fs from 'fs-extra';

function getComponentsJsonPath(): string {
  return join(process.cwd(), 'components.json');
}

export async function readComponentsJson(): Promise<Record<string, unknown>> {
  const filePath = getComponentsJsonPath();

  if (!(await fs.pathExists(filePath))) {
    throw new Error(
      'components.json not found. Make sure you are in a MakerKit project root.',
    );
  }

  return fs.readJson(filePath);
}

export async function writeComponentsJson(
  config: Record<string, unknown>,
): Promise<void> {
  const filePath = getComponentsJsonPath();

  await fs.writeJson(filePath, config, { spaces: 2 });
}

export async function addMakerkitRegistry(
  variant: string,
  licenseKey: string,
): Promise<void> {
  const config = await readComponentsJson();

  const registries = (config.registries ?? {}) as Record<string, unknown>;

  registries['@makerkit'] = {
    url: `https://plugins.makerkit.dev/${variant}/r`,
    headers: {
      Authorization: `Bearer ${licenseKey}`,
    },
  };

  config.registries = registries;

  await writeComponentsJson(config);
}
