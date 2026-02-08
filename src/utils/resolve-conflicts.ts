import { dirname, join } from 'path';

import { execa, execaCommand } from 'execa';
import fs from 'fs-extra';

export interface ResolveConflictsOptions {
  projectPath: string;
  files: { path: string; content: string }[];
  commitMessage?: string;
}

export type ResolveConflictsResult =
  | { success: true; resolved: string[]; message: string }
  | {
      success: false;
      resolved: string[];
      remaining: string[];
      message: string;
    };

export async function resolveConflicts(
  options: ResolveConflictsOptions,
): Promise<ResolveConflictsResult> {
  const cwd = process.cwd();

  for (const file of options.files) {
    const targetPath = join(cwd, file.path);

    await fs.ensureDir(dirname(targetPath));
    await fs.writeFile(targetPath, file.content);
  }

  const paths = options.files.map((f) => f.path);

  await execa('git', ['add', ...paths]);

  let remainingConflicts: string[] = [];

  try {
    const { stdout } = await execaCommand(
      'git diff --name-only --diff-filter=U',
    );

    remainingConflicts = stdout.trim().split('\n').filter(Boolean);
  } catch {
    remainingConflicts = [];
  }

  if (remainingConflicts.length > 0) {
    return {
      success: false,
      resolved: paths,
      remaining: remainingConflicts,
      message: `${paths.length} file(s) resolved, but ${remainingConflicts.length} conflict(s) remain. Resolve the remaining files and call makerkit_project_resolve_conflicts again.`,
    };
  }

  if (options.commitMessage) {
    await execa('git', ['commit', '-m', options.commitMessage]);
  } else {
    await execaCommand('git commit --no-edit');
  }

  return {
    success: true,
    resolved: paths,
    message: 'All conflicts resolved and merge commit created.',
  };
}
