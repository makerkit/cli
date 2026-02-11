import { initRegistry } from '@/src/utils/init-registry';
import { listPlugins } from '@/src/utils/list-plugins';
import { getOrPromptUsername } from '@/src/utils/username-cache';
import chalk from 'chalk';
import { Command } from 'commander';

export function createInitCommand(parentCommand: Command) {
  return parentCommand
    .command('init')
    .description(
      'Initialize MakerKit plugin registry in your project (one-time setup).',
    )
    .action(async () => {
      try {
        const username = await getOrPromptUsername();

        const initResult = await initRegistry({
          projectPath: process.cwd(),
          githubUsername: username,
        });

        console.log(
          `Detected project variant: ${chalk.cyan(initResult.variant)}\n`,
        );

        console.log(chalk.green('Registry configured.\n'));

        const pluginsResult = await listPlugins({ projectPath: process.cwd() });

        console.log(chalk.white('Available plugins:\n'));

        for (const plugin of pluginsResult.plugins) {
          console.log(
            `  ${chalk.green(plugin.name)} ${chalk.gray(`(${plugin.id})`)}`,
          );
        }

        console.log(
          `\nRun ${chalk.cyan('makerkit plugins add <plugin-id>')} to install a plugin.`,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';

        console.error(chalk.red(`Error: ${message}`));
        process.exit(1);
      }
    });
}
