import {
  PluginRegistry,
  getEnvVars,
  isInstalled,
} from '@/src/plugins-model';
import {
  clearCachedUsername,
  getOrPromptUsername,
} from '@/src/utils/username-cache';
import { appendEnvVars } from '@/src/utils/env-vars';
import { isGitClean } from '@/src/utils/git';
import { installRegistryFiles } from '@/src/utils/install-registry-files';
import { runCodemod } from '@/src/utils/run-codemod';
import { validateProject } from '@/src/utils/workspace';
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
        // 1. Validate git is clean
        const gitClean = await isGitClean();

        if (!gitClean) {
          console.error(
            chalk.red(
              'Your git working directory has uncommitted changes. Please commit or stash them before adding a plugin.',
            ),
          );

          process.exit(1);
        }

        // 2. Validate project and detect variant
        const { variant } = await validateProject();

        // 3. Load registry and resolve username once
        const registry = await PluginRegistry.load();

        if (!pluginIds || pluginIds.length === 0) {
          const plugins = registry.getPluginsForVariant(variant);

          const available = [];

          for (const p of plugins) {
            if (!(await isInstalled(p, variant))) {
              available.push(p);
            }
          }

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

        const username = await getOrPromptUsername();

        for (const pluginId of pluginIds) {
          try {
            const plugin = registry.validatePlugin(pluginId, variant);

            // 4. Check if already installed via filesystem
            if (await isInstalled(plugin, variant)) {
              console.log(
                chalk.yellow(
                  `Plugin "${plugin.name}" is already installed. Skipping.`,
                ),
              );

              continue;
            }

            console.log(
              `\nInstalling ${chalk.cyan(plugin.name)} (${chalk.gray(plugin.id)}) for ${chalk.gray(variant)}...\n`,
            );

            // 5. Fetch and write plugin files from registry
            const filesSpinner = ora('Installing plugin files...').start();

            try {
              await installRegistryFiles(variant, pluginId, username);
            } catch (error) {
              filesSpinner.fail('Failed to install plugin files.');

              clearCachedUsername();

              console.log(
                chalk.yellow('\nRetrying with a different username...\n'),
              );

              const retryUsername = await getOrPromptUsername();

              const retrySpinner = ora('Installing plugin files...').start();
              await installRegistryFiles(variant, pluginId, retryUsername);
              retrySpinner.succeed('Plugin files installed.');
            }

            if (filesSpinner.isSpinning) {
              filesSpinner.succeed('Plugin files installed.');
            }

            // 6. Run codemod (AST transforms + workspace deps)
            console.log(chalk.gray('\nRunning plugin codemod...\n'));
            const codemodResult = await runCodemod(variant, pluginId);

            if (!codemodResult.success) {
              console.error(chalk.red(`\nPlugin "${pluginId}" installation failed.`));
              console.error(chalk.red(codemodResult.output));
              console.log(
                chalk.yellow(
                  '\nTo revert changes, run: git checkout . && git clean -fd',
                ),
              );

              process.exit(1);
            }

            // 7. Add env vars (variant-specific)
            const envVars = getEnvVars(plugin, variant);

            if (envVars.length > 0) {
              const envSpinner = ora('Adding environment variables...').start();

              await appendEnvVars(envVars, plugin.name);

              envSpinner.succeed('Environment variables added.');
            }

            // 8. Print summary
            console.log(chalk.green(`\n${plugin.name} installed successfully!`));

            if (envVars.length > 0) {
              console.log(chalk.white('\nEnvironment variables to configure:'));

              for (const envVar of envVars) {
                console.log(
                  `  ${chalk.cyan(envVar.key)} - ${envVar.description}`,
                );
              }
            }

            if (plugin.postInstallMessage) {
              console.log(chalk.white('\nNext steps:'));
              console.log(`  ${chalk.cyan(plugin.postInstallMessage)}`);
            }
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';

            console.error(chalk.red(`\nError installing "${pluginId}": ${message}`));
            console.log(
              chalk.yellow(
                '\nTo revert changes, run: git checkout . && git clean -fd',
              ),
            );

            process.exit(1);
          }
        }

        // 9. Post-install warnings and tips
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
