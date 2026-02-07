import { execaCommand } from 'execa';

export async function runCodemod(
  variant: string,
  pluginId: string,
): Promise<{ success: boolean; output: string }> {
  try {
    const localPath = process.env.MAKERKIT_CODEMODS_PATH;
    const runner = process.env.MAKERKIT_PACKAGE_RUNNER ?? 'npx';

    const command = localPath
      ? `${runner} codemod workflow run -w ${localPath}/codemods/${variant}/${pluginId}`
      : `${runner} codemod @makerkit/${variant}-${pluginId}`;

    const { stdout, stderr } = await execaCommand(command);

    return {
      success: true,
      output: stdout || stderr,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error during codemod';

    return {
      success: false,
      output: message,
    };
  }
}
