import { execaCommand } from 'execa';

const CODEMOD_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export async function runCodemod(
  variant: string,
  pluginId: string,
  options?: { captureOutput?: boolean },
): Promise<{ success: boolean; output: string }> {
  try {
    const localPath = process.env.MAKERKIT_CODEMODS_PATH;
    const runner = process.env.MAKERKIT_PACKAGE_RUNNER ?? 'npx --yes';

    const command = localPath
      ? `${runner} codemod workflow run --allow-dirty -w ${localPath}/codemods/${variant}/${pluginId}`
      : `${runner} codemod --allow-dirty @makerkit/${variant}-${pluginId}`;

    const { stdout, stderr } = await execaCommand(command, {
      stdio: options?.captureOutput ? 'pipe' : 'inherit',
      timeout: CODEMOD_TIMEOUT_MS,
    });

    return {
      success: true,
      output: stdout || stderr || '',
    };
  } catch (error) {
    let message = 'Unknown error during codemod';

    if (error instanceof Error) {
      message = error.message;

      if ('stderr' in error && error.stderr) {
        message += `\n${error.stderr}`;
      }

      if ('timedOut' in error && error.timedOut) {
        message = `Codemod timed out after ${CODEMOD_TIMEOUT_MS / 1000}s (the workflow engine may have stalled after an error)`;
      }
    }

    return {
      success: false,
      output: message,
    };
  }
}
