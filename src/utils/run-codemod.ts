import { spawn } from 'node:child_process';

const CODEMOD_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const IDLE_KILL_MS = 3_000;

export async function runCodemod(
  variant: string,
  pluginId: string,
  codemodVersion?: string,
  options?: { noInteractive?: boolean },
): Promise<{ success: boolean; output: string }> {
  try {
    const localPath = process.env.MAKERKIT_CODEMODS_PATH;
    const runner = process.env.MAKERKIT_PACKAGE_RUNNER ?? 'npx --yes';
    const versionTag = codemodVersion ? `@${codemodVersion}` : '';
    const noInteractive = options?.noInteractive ?? true;
    const flags = ['--allow-dirty', noInteractive && '--no-interactive'].filter(Boolean).join(' ');

    const command = localPath
      ? `${runner} codemod@latest workflow run ${flags} -w ${localPath}/codemods/${variant}/${pluginId}`
      : `${runner} codemod@latest run @makerkit/${variant}-${pluginId}${versionTag} ${flags}`;

    return await new Promise<{ success: boolean; output: string }>(
      (resolve, reject) => {
        const child = spawn(command, {
          shell: true,
          stdio: noInteractive ? ['ignore', 'pipe', 'pipe'] : 'inherit',
        });

        let idleTimer: ReturnType<typeof setTimeout> | null = null;
        const resetIdle = () => {
          if (idleTimer) clearTimeout(idleTimer);
          idleTimer = setTimeout(() => {
            child.kill();
          }, IDLE_KILL_MS);
        };

        if (child.stdout) {
          child.stdout.pipe(process.stdout);
          child.stdout.on('data', () => resetIdle());
        }

        if (child.stderr) {
          child.stderr.pipe(process.stderr);
          child.stderr.on('data', () => resetIdle());
        }

        // Start idle timer in case there's no output at all
        resetIdle();

        const globalTimer = setTimeout(() => {
          if (idleTimer) clearTimeout(idleTimer);
          child.kill();
          resolve({
            success: false,
            output: `Codemod timed out after ${CODEMOD_TIMEOUT_MS / 1000}s`,
          });
        }, CODEMOD_TIMEOUT_MS);

        child.on('exit', (code) => {
          clearTimeout(globalTimer);
          if (idleTimer) clearTimeout(idleTimer);
          resolve({
            success: code === 0 || code === null,
            output: code === 0 || code === null ? '' : `Command failed with exit code ${code}`,
          });
        });

        child.on('error', (err) => {
          clearTimeout(globalTimer);
          if (idleTimer) clearTimeout(idleTimer);
          reject(err);
        });
      },
    );
  } catch (error) {
    let message = 'Unknown error during codemod';

    if (error instanceof Error) {
      message = error.message;
    }

    return {
      success: false,
      output: message,
    };
  }
}
