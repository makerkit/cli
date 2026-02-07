import { execaCommand } from 'execa';

export async function isGitClean(): Promise<boolean> {
  const { stdout } = await execaCommand('git status --porcelain');

  return stdout.trim() === '';
}

export async function getGitRoot(): Promise<string> {
  const { stdout } = await execaCommand('git rev-parse --show-toplevel');

  return stdout.trim();
}
