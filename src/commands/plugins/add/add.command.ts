import {
  PluginRegistry,
  getEnvVars,
  isInstalled,
} from '@/src/plugins-model';
import {
  addMakerkitRegistry,
  isMakerkitRegistryConfigured,
} from '@/src/utils/components-json';
import { appendEnvVars } from '@/src/utils/env-vars';
import { isGitClean } from '@/src/utils/git';
import { runCodemod } from '@/src/utils/run-codemod';
import { validateProject } from '@/src/utils/workspace';
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

export function createAddCommand(parentCommand: Command) {
  return parentCommand
    .command('add')
    .argument('<plugin-id>', 'Plugin to install (e.g. feedback, waitlist)')
    .description('Install a MakerKit plugin.')
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

        // 2. Validate project and detect variant
        const { variant } = await validateProject();

        // 3. Auto-init registry if not configured
        if (!(await isMakerkitRegistryConfigured())) {
          const initSpinner = ora('Configuring MakerKit registry...').start();
          await addMakerkitRegistry(variant);
          initSpinner.succeed('MakerKit registry configured.');
        }

        // 4. Load registry and validate plugin supports this variant
        const registry = await PluginRegistry.load();
        const plugin = registry.validatePlugin(pluginId, variant);

        // 4. Check if already installed via filesystem
        if (await isInstalled(plugin, variant)) {
          console.error(
            chalk.yellow(
              `Plugin "${plugin.name}" is already installed. Use "plugins list" to see installed plugins.`,
            ),
          );

          return;
        }

        console.log(
          `\nInstalling ${chalk.cyan(plugin.name)} (${chalk.gray(plugin.id)}) for ${chalk.gray(variant)}...\n`,
        );

        // 5. Run codemod (handles shadcn add + AST transforms)
        const codemodSpinner = ora('Installing plugin...').start();
        const codemodResult = await runCodemod(variant, pluginId);

        if (!codemodResult.success) {
          codemodSpinner.fail('Plugin installation failed.');

          console.error(chalk.red(`\n${codemodResult.output}`));
          console.log(
            chalk.yellow(
              '\nTo revert changes, run: git checkout . && git clean -fd',
            ),
          );

          process.exit(1);
        }

        codemodSpinner.succeed('Plugin installed.');

        // 6. Add env vars (variant-specific)
        const envVars = getEnvVars(plugin, variant);

        if (envVars.length > 0) {
          const envSpinner = ora('Adding environment variables...').start();

          await appendEnvVars(envVars, plugin.name);

          envSpinner.succeed('Environment variables added.');
        }

        // 7. Print summary
        console.log(chalk.green(`\n${plugin.name} installed successfully!\n`));

        if (envVars.length > 0) {
          console.log(chalk.white('Environment variables to configure:'));

          for (const envVar of envVars) {
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

        // 8. Post-install warnings and tips
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
