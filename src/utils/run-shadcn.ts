import { execaCommand } from 'execa';

export async function runShadcnAdd(
  pluginId: string,
): Promise<{ success: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execaCommand(
      `npx shadcn@latest add @makerkit/${pluginId}`,
    );

    return {
      success: true,
      output: stdout || stderr,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error during shadcn add';

    return {
      success: false,
      output: message,
    };
  }
}
