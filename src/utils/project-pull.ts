import { join } from 'path';

import { execa, execaCommand } from 'execa';
import fs from 'fs-extra';

import { getErrorOutput, isGitClean } from '@/src/utils/git';
import {
  getUpstreamRemoteUrl,
  getUpstreamUrl,
  hasSshAccess,
  isUpstreamUrlValid,
  setUpstreamRemote,
} from '@/src/utils/upstream';
import { validateProject } from '@/src/utils/workspace';

export interface ProjectPullOptions {
  projectPath: string;
}

export type ProjectPullResult =
  | {
      success: true;
      variant: string;
      upstreamUrl: string;
      alreadyUpToDate: boolean;
      message: string;
    }
  | {
      success: false;
      variant: string;
      upstreamUrl: string;
      hasConflicts: true;
      conflictCount: number;
      conflicts: {
        path: string;
        conflicted?: string;
        base?: string;
        ours?: string;
        theirs?: string;
      }[];
      instructions: string;
    }
  | { success: false; reason: string };

export async function projectPull(
  options: ProjectPullOptions,
): Promise<ProjectPullResult> {
  const { variant } = await validateProject();

  const gitClean = await isGitClean();

  if (!gitClean) {
    return {
      success: false,
      reason:
        'Git working directory has uncommitted changes. Please commit or stash them before pulling upstream updates.',
    };
  }

  let currentUrl = await getUpstreamRemoteUrl();

  if (!currentUrl) {
    const useSsh = await hasSshAccess();
    const url = getUpstreamUrl(variant, useSsh);

    await setUpstreamRemote(url);
    currentUrl = url;
  } else if (!isUpstreamUrlValid(currentUrl, variant)) {
    const useSsh = currentUrl.startsWith('git@');
    const expectedUrl = getUpstreamUrl(variant, useSsh);

    return {
      success: false,
      reason:
        `Upstream remote points to "${currentUrl}" but expected "${expectedUrl}" for variant "${variant}". ` +
        'Please ask the user whether to update the upstream URL, then run: git remote set-url upstream <correct-url>',
    };
  }

  await execaCommand('git fetch upstream');

  try {
    const { stdout } = await execaCommand(
      'git merge upstream/main --no-edit',
    );

    const alreadyUpToDate = stdout.includes('Already up to date');

    return {
      success: true,
      variant,
      upstreamUrl: currentUrl,
      alreadyUpToDate,
      message: alreadyUpToDate
        ? 'Already up to date.'
        : 'Successfully merged upstream changes.',
    };
  } catch (mergeError) {
    const output = getErrorOutput(mergeError);
    const isConflict =
      output.includes('CONFLICT') ||
      output.includes('Automatic merge failed');

    if (!isConflict) {
      throw new Error(`Merge failed: ${output}`);
    }

    const { stdout: statusOutput } = await execaCommand(
      'git diff --name-only --diff-filter=U',
    );

    const conflictPaths = statusOutput
      .trim()
      .split('\n')
      .filter(Boolean);

    const cwd = process.cwd();

    const conflicts = await Promise.all(
      conflictPaths.map(async (filePath) => {
        let conflicted: string | undefined;

        try {
          conflicted = await fs.readFile(join(cwd, filePath), 'utf-8');
        } catch {
          conflicted = undefined;
        }

        let base: string | undefined;
        let ours: string | undefined;
        let theirs: string | undefined;

        try {
          const { stdout: b } = await execa('git', [
            'show',
            `:1:${filePath}`,
          ]);
          base = b;
        } catch {
          base = undefined;
        }

        try {
          const { stdout: o } = await execa('git', [
            'show',
            `:2:${filePath}`,
          ]);
          ours = o;
        } catch {
          ours = undefined;
        }

        try {
          const { stdout: t } = await execa('git', [
            'show',
            `:3:${filePath}`,
          ]);
          theirs = t;
        } catch {
          theirs = undefined;
        }

        return { path: filePath, conflicted, base, ours, theirs };
      }),
    );

    return {
      success: false,
      variant,
      upstreamUrl: currentUrl,
      hasConflicts: true,
      conflictCount: conflicts.length,
      conflicts,
      instructions:
        'Merge conflicts detected. For each conflict: review base, ours (local), and theirs (upstream) versions. ' +
        'Produce resolved content and call makerkit_project_resolve_conflicts. ' +
        'Ask the user for guidance when the intent behind local changes is unclear.',
    };
  }
}
