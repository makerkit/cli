import { spawn } from 'node:child_process';

const CODEMOD_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Guards against a codemod CLI hang, not against slow work.
 *
 * This was 3s, which is shorter than plenty of legitimate steps — a git clone,
 * a `pnpm install`, a typecheck. Worse, killing our child does not stop its
 * descendants: the plugin that tripped this had its files fetched by an
 * orphaned `git` while the workflow itself was already dead, leaving a
 * half-installed repo and no error. Keep the hang protection, but well above
 * the quiet stretches real steps have.
 */
const IDLE_KILL_MS = 3 * 60 * 1000; // 3 minutes

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

        child.on('exit', (code, signal) => {
          clearTimeout(globalTimer);
          if (idleTimer) clearTimeout(idleTimer);

          if (code === 0) {
            return resolve({ success: true, output: '' });
          }

          // A null code means a signal ended it — the idle guard above, or the
          // user interrupting. Reporting that as success is how a half-applied
          // codemod used to pass silently, leaving the caller to print a
          // success summary over a broken repo.
          if (code === null) {
            return resolve({
              success: false,
              output: signal
                ? `Codemod was terminated by ${signal} before it finished. It may have applied some changes but not others — check "git status" before re-running.`
                : 'Codemod exited without a status code before it finished.',
            });
          }

          resolve({
            success: false,
            output: `Command failed with exit code ${code}`,
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
