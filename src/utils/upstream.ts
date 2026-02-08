import type { Variant } from '@/src/utils/workspace';

import { execaCommand } from 'execa';

const VARIANT_REPO_MAP: Record<Variant, string> = {
  'next-supabase': 'makerkit/next-supabase-saas-kit-turbo',
  'next-drizzle': 'makerkit/next-drizzle-saas-kit-turbo',
  'next-prisma': 'makerkit/next-prisma-saas-kit-turbo',
  'react-router-supabase': 'makerkit/react-router-supabase-saas-kit-turbo',
};

function sshUrl(repo: string): string {
  return `git@github.com:${repo}`;
}

function httpsUrl(repo: string): string {
  return `https://github.com/${repo}`;
}

export async function hasSshAccess(): Promise<boolean> {
  try {
    await execaCommand('ssh -T git@github.com -o StrictHostKeyChecking=no', {
      timeout: 10_000,
    });

    return true;
  } catch (error) {
    // ssh -T git@github.com exits with code 1 even on success,
    // but prints "successfully authenticated" in stderr
    const stderr =
      error instanceof Error && 'stderr' in error
        ? String((error as { stderr: unknown }).stderr)
        : '';

    return stderr.includes('successfully authenticated');
  }
}

export function getUpstreamUrl(variant: Variant, useSsh: boolean): string {
  const repo = VARIANT_REPO_MAP[variant];

  return useSsh ? sshUrl(repo) : httpsUrl(repo);
}

/**
 * Check if a remote URL points to the correct repo for the given variant,
 * regardless of whether it uses SSH or HTTPS.
 * Handles trailing `.git` and `/` in URLs.
 */
export function isUpstreamUrlValid(
  url: string,
  variant: Variant,
): boolean {
  const normalized = url.replace(/\/+$/, '').replace(/\.git$/, '');
  const repo = VARIANT_REPO_MAP[variant];

  return normalized === sshUrl(repo) || normalized === httpsUrl(repo);
}

export async function getUpstreamRemoteUrl(): Promise<string | undefined> {
  try {
    const { stdout } = await execaCommand('git remote get-url upstream');
    return stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}

export async function setUpstreamRemote(url: string): Promise<void> {
  const currentUrl = await getUpstreamRemoteUrl();

  if (currentUrl) {
    await execaCommand(`git remote set-url upstream ${url}`);
  } else {
    await execaCommand(`git remote add upstream ${url}`);
  }
}
