import { cacheUsername } from '@/src/utils/username-cache';
import { detectVariant } from '@/src/utils/workspace';

export interface InitRegistryOptions {
  projectPath: string;
  githubUsername: string;
}

export interface InitRegistryResult {
  success: true;
  variant: string;
  username: string;
}

export async function initRegistry(
  options: InitRegistryOptions,
): Promise<InitRegistryResult> {
  const variant = await detectVariant();

  cacheUsername(options.githubUsername);

  return {
    success: true,
    variant,
    username: options.githubUsername,
  };
}
