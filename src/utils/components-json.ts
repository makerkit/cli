import { join } from 'path';

import fs from 'fs-extra';
import prompts from 'prompts';

import { getGitUsername } from '@/src/utils/git';

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

export async function isMakerkitRegistryConfigured(): Promise<boolean> {
  const filePath = getComponentsJsonPath();

  if (!(await fs.pathExists(filePath))) {
    return false;
  }

  const config = await fs.readJson(filePath);
  const registries = config.registries as Record<string, unknown> | undefined;

  return !!registries?.['@makerkit'];
}

export async function addMakerkitRegistry(
  variant: string,
): Promise<void> {
  const filePath = getComponentsJsonPath();
  const config = (await fs.pathExists(filePath))
    ? await fs.readJson(filePath)
    : {};

  const registries = (config.registries ?? {}) as Record<string, unknown>;
  const gitUsername = await getGitUsername();

  const response = await prompts({
    type: 'text',
    name: 'githubUsername',
    message:
      'Enter the GitHub username registered with your Makerkit account',
    initial: gitUsername,
    validate: (value) => {
      return value.trim().length > 0 ? true : 'GitHub username is required';
    },
  });

  const githubUsername = (response.githubUsername as string | undefined)?.trim();

  if (!githubUsername) {
    throw new Error('Registry setup cancelled. GitHub username is required.');
  }

  registries['@makerkit'] = {
    url: `https://makerkit.dev/r/${variant}`,
    headers: {
      Authorization: 'Bearer ${MAKERKIT_REGISTRY_TOKEN}',
    },
    params: {
      username: githubUsername,
    },
  };

  config.registries = registries;

  await writeComponentsJson(config);
}
