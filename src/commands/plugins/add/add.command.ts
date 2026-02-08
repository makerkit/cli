import { addPlugin } from '@/src/utils/add-plugin';
import { isGitClean } from '@/src/utils/git';
import { listPlugins } from '@/src/utils/list-plugins';
import {
  clearCachedUsername,
  getOrPromptUsername,
} from '@/src/utils/username-cache';
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import prompts from 'prompts';

export function createAddCommand(parentCommand: Command) {
  return parentCommand
    .command('add')
    .argument('[plugin-id...]', 'Plugins to install (e.g. feedback waitlist)')
    .description('Install one or more MakerKit plugins.')
    .action(async (pluginIds: string[]) => {
      try {
        // 1. Validate git is clean once upfront
        const gitClean = await isGitClean();

        if (!gitClean) {
          console.error(
            chalk.red(
              'Your git working directory has uncommitted changes. Please commit or stash them before adding a plugin.',
            ),
          );

          process.exit(1);
        }

        // 2. If no plugin IDs provided, show interactive selection
        if (!pluginIds || pluginIds.length === 0) {
          const pluginsResult = await listPlugins({ projectPath: process.cwd() });
          const available = pluginsResult.plugins.filter((p) => !p.installed);

          if (available.length === 0) {
            console.log(chalk.green('All plugins are already installed.'));
            return;
          }

          const response = await prompts({
            type: 'multiselect',
            name: 'pluginIds',
            message: 'Select plugins to install',
            choices: available.map((p) => ({
              title: `${p.name} ${chalk.gray(`(${p.id})`)}`,
              value: p.id,
            })),
          });

          pluginIds = response.pluginIds as string[] | undefined ?? [];

          if (pluginIds.length === 0) {
            return;
          }
        }

        // 3. Prompt for username once
        let username = await getOrPromptUsername();

        // 4. Install each plugin
        for (const pluginId of pluginIds) {
          console.log(
            `\nInstalling ${chalk.cyan(pluginId)}...\n`,
          );

          const filesSpinner = ora('Installing plugin...').start();

          let result;

          try {
            result = await addPlugin({
              projectPath: process.cwd(),
              pluginId,
              githubUsername: username,
              skipGitCheck: true,
              captureCodemodOutput: false,
            });
          } catch (error) {
            // Auth failure — clear username, re-prompt, retry once
            filesSpinner.fail('Failed to install plugin.');

            clearCachedUsername();

            console.log(
              chalk.yellow('\nRetrying with a different username...\n'),
            );

            username = await getOrPromptUsername();

            const retrySpinner = ora('Installing plugin...').start();

            try {
              result = await addPlugin({
                projectPath: process.cwd(),
                pluginId,
                githubUsername: username,
                skipGitCheck: true,
                captureCodemodOutput: false,
              });
            } catch (retryError) {
              retrySpinner.fail('Failed to install plugin.');

              const message =
                retryError instanceof Error ? retryError.message : 'Unknown error';

              console.error(chalk.red(`\nError installing "${pluginId}": ${message}`));
              console.log(
                chalk.yellow(
                  '\nTo revert changes, run: git checkout . && git clean -fd',
                ),
              );

              process.exit(1);
            }

            if (result.success) {
              retrySpinner.succeed('Plugin installed.');
            } else {
              retrySpinner.stop();
            }
          }

          if (!result.success) {
            if (result.reason.includes('already installed')) {
              filesSpinner.warn(result.reason + ' Skipping.');
              continue;
            }

            filesSpinner.fail('Failed to install plugin.');
            console.error(chalk.red(`\n${result.reason}`));
            console.log(
              chalk.yellow(
                '\nTo revert changes, run: git checkout . && git clean -fd',
              ),
            );

            process.exit(1);
          }

          if (filesSpinner.isSpinning) {
            filesSpinner.succeed(`${result.pluginName} installed successfully!`);
          }

          if (result.envVars.length > 0) {
            console.log(chalk.white('\nEnvironment variables to configure:'));

            for (const envVar of result.envVars) {
              console.log(
                `  ${chalk.cyan(envVar.key)} - ${envVar.description}`,
              );
            }
          }

          if (result.postInstallMessage) {
            console.log(chalk.white('\nNext steps:'));
            console.log(`  ${chalk.cyan(result.postInstallMessage)}`);
          }
        }

        // 5. Post-install warnings
        console.log('');
        console.log(chalk.yellow('Important:'));
        console.log(
          chalk.yellow(
            '  This plugin was installed using an automated migration.',
          ),
        );
        console.log(
          chalk.yellow(
            '  Please review the changes manually and test thoroughly before committing.',
          ),
        );
        console.log('');
        console.log(chalk.white('Tips:'));
        console.log(
          `  ${chalk.gray('-')} Run ${chalk.cyan('git diff')} to review all changes made by the migration.`,
        );
        console.log(
          `  ${chalk.gray('-')} Use an AI assistant (e.g. Claude) as a first pass to review the diff for issues.`,
        );
        console.log(
          `  ${chalk.gray('-')} Run your test suite and verify the app builds before committing.`,
        );
        console.log(
          `  ${chalk.gray('-')} To undo all changes: ${chalk.cyan('git checkout . && git clean -fd')}`,
        );
        console.log('');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';

        console.error(chalk.red(`Error: ${message}`));
        console.log(
          chalk.yellow(
            '\nTo revert changes, run: git checkout . && git clean -fd',
          ),
        );

        process.exit(1);
      }
    });
}
