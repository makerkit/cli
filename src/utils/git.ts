import { execaCommand } from 'execa';

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
