import { join } from 'path';

import { execa } from 'execa';
import fs from 'fs-extra';

import { writeMarkerFile } from '@/src/utils/marker-file';
import { VARIANT_REPO_MAP, hasSshAccess } from '@/src/utils/upstream';
import type { Variant } from '@/src/utils/workspace';

export interface CreateProjectOptions {
  variant: Variant;
  name: string;
  directory: string;
  githubToken?: string;
}

export interface CreateProjectResult {
  success: boolean;
  projectPath: string;
  variant: Variant;
  kitRepo: string;
  message: string;
}

export async function createProject(
  options: CreateProjectOptions,
): Promise<CreateProjectResult> {
  const { variant, name, directory, githubToken } = options;
  const projectPath = join(directory, name);
  const repo = VARIANT_REPO_MAP[variant];

  // 1. Validate target dir doesn't already exist
  if (await fs.pathExists(projectPath)) {
    throw new Error(
      `Target directory "${projectPath}" already exists. Choose a different name or remove it first.`,
    );
  }

  // 2. Validate parent dir exists
  if (!(await fs.pathExists(directory))) {
    throw new Error(
      `Parent directory "${directory}" does not exist.`,
    );
  }

  // 3. Resolve clone URL
  let cloneUrl: string;

  if (githubToken) {
    cloneUrl = `https://${githubToken}@github.com/${repo}`;
  } else {
    const useSsh = await hasSshAccess();
    cloneUrl = useSsh
      ? `git@github.com:${repo}`
      : `https://github.com/${repo}`;
  }

  // 4. Clone
  await execa('git', ['clone', cloneUrl, name], { cwd: directory });

  // 5. Strip token from remote if needed
  if (githubToken) {
    await execa(
      'git',
      ['remote', 'set-url', 'origin', `https://github.com/${repo}`],
      { cwd: projectPath },
    );
  }

  // 6. Install dependencies
  await execa('pnpm', ['install'], { cwd: projectPath });

  // 7. Write marker file
  await writeMarkerFile(projectPath, variant, repo);

  return {
    success: true,
    projectPath,
    variant,
    kitRepo: repo,
    message: `Project "${name}" created successfully with variant "${variant}".`,
  };
}
