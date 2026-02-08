import { execaCommand } from 'execa';

export function getErrorOutput(error: unknown): string {
  if (error instanceof Error && 'stderr' in error) {
    const stderr = String((error as { stderr: unknown }).stderr);

    if (stderr) return stderr;
  }

  if (error instanceof Error && 'stdout' in error) {
    const stdout = String((error as { stdout: unknown }).stdout);

    if (stdout) return stdout;
  }

  return error instanceof Error ? error.message : String(error);
}

export async function isGitClean(): Promise<boolean> {
  const { stdout } = await execaCommand('git status --porcelain');

  return stdout.trim() === '';
}

export async function getGitRoot(): Promise<string> {
  const { stdout } = await execaCommand('git rev-parse --show-toplevel');

  return stdout.trim();
}

export async function getGitUsername(): Promise<string | undefined> {
  try {
    const { stdout } = await execaCommand('git config --get user.username');
    const username = stdout.trim();

    return username.length > 0 ? username : undefined;
  } catch {
    return undefined;
  }
}
