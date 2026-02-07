import { execaCommand } from 'execa';

export async function runCodemod(
  pluginId: string,
): Promise<{ success: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execaCommand(
      `npx codemod @makerkit/add-${pluginId}`,
    );

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
