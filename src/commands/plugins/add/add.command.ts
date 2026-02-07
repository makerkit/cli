import { validatePlugin } from '@/src/plugins-model';
import { appendEnvVars } from '@/src/utils/env-vars';
import { isGitClean } from '@/src/utils/git';
import { addPluginToManifest, isPluginInstalled } from '@/src/utils/manifest';
import { runCodemod } from '@/src/utils/run-codemod';
import { runShadcnAdd } from '@/src/utils/run-shadcn';
import { validateProject } from '@/src/utils/workspace';
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

export function createAddCommand(parentCommand: Command) {
  return parentCommand
    .command('add')
    .argument('<plugin-id>', 'Plugin to install (e.g. feedback, chatbot)')
    .description('Install a MakerKit plugin via the shadcn registry.')
    .action(async (pluginId: string) => {
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

        // 2. Validate project and plugin
        const { variant, version } = await validateProject();
        const plugin = validatePlugin(pluginId);

        // 3. Check if already installed
        if (await isPluginInstalled(pluginId)) {
          console.error(
            chalk.yellow(
              `Plugin "${plugin.name}" is already installed. Use "plugins list" to see installed plugins.`,
            ),
          );

          return;
        }

        console.log(
          `\nInstalling ${chalk.cyan(plugin.name)} (${chalk.gray(plugin.id)})...\n`,
        );

        // 4. Run shadcn add
        const shadcnSpinner = ora('Installing plugin files via shadcn...').start();
        const shadcnResult = await runShadcnAdd(pluginId);

        if (!shadcnResult.success) {
          shadcnSpinner.fail('Failed to install plugin files.');

          console.error(chalk.red(`\nshadcn add error:\n${shadcnResult.output}`));
          console.log(
            chalk.yellow(
              '\nTo revert changes, run: git checkout . && git clean -fd',
            ),
          );

          process.exit(1);
        }

        shadcnSpinner.succeed('Plugin files installed.');

        // 5. Run codemod
        const codemodSpinner = ora('Applying code transforms...').start();
        const codemodResult = await runCodemod(pluginId);

        if (!codemodResult.success) {
          codemodSpinner.warn('Codemod step failed (may not be available yet).');

          console.log(
            chalk.yellow(`  ${codemodResult.output}\n`),
          );
        } else {
          codemodSpinner.succeed('Code transforms applied.');
        }

        // 6. Add env vars
        if (plugin.envVars.length > 0) {
          const envSpinner = ora('Adding environment variables...').start();

          await appendEnvVars(plugin.envVars, plugin.name);

          envSpinner.succeed('Environment variables added.');
        }

        // 7. Update manifest
        await addPluginToManifest(pluginId, version, variant);

        // 8. Print summary
        console.log(chalk.green(`\n${plugin.name} installed successfully!\n`));

        if (plugin.envVars.length > 0) {
          console.log(chalk.white('Environment variables to configure:'));

          for (const envVar of plugin.envVars) {
            console.log(
              `  ${chalk.cyan(envVar.key)} - ${envVar.description}`,
            );
          }

          console.log('');
        }

        if (plugin.postInstallMessage) {
          console.log(chalk.white('Next steps:'));
          console.log(`  ${chalk.cyan(plugin.postInstallMessage)}\n`);
        }
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
