import { join } from 'path';
import { tmpdir } from 'os';

import fs from 'fs-extra';
import prompts from 'prompts';

import { getGitUsername } from '@/src/utils/git';

const USERNAME_FILE = join(tmpdir(), 'makerkit-username');

export function getCachedUsername(): string | undefined {
  try {
    const username = fs.readFileSync(USERNAME_FILE, 'utf-8').trim();

    return username.length > 0 ? username : undefined;
  } catch {
    return undefined;
  }
}

export function cacheUsername(username: string): void {
  fs.writeFileSync(USERNAME_FILE, username, 'utf-8');
}

export function clearCachedUsername(): void {
  try {
    fs.removeSync(USERNAME_FILE);
  } catch {
    // ignore
  }
}

export async function promptForUsername(): Promise<string> {
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

  const username = (response.githubUsername as string | undefined)?.trim();

  if (!username) {
    throw new Error('Setup cancelled. GitHub username is required.');
  }

  cacheUsername(username);

  return username;
}

export async function getOrPromptUsername(
  providedUsername?: string,
): Promise<string> {
  if (providedUsername?.trim()) {
    const username = providedUsername.trim();

    cacheUsername(username);

    return username;
  }

  const cached = getCachedUsername();

  if (cached) {
    return cached;
  }

  return promptForUsername();
}
