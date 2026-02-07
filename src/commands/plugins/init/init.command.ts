import { PluginRegistry } from '@/src/plugins-model';
import { getOrPromptUsername } from '@/src/utils/components-json';
import { detectVariant } from '@/src/utils/workspace';
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
        const variant = await detectVariant();

        console.log(
          `Detected project variant: ${chalk.cyan(variant)}\n`,
        );

        await getOrPromptUsername();

        console.log(chalk.green('Registry configured.\n'));

        const registry = await PluginRegistry.load();
        const plugins = registry.getPluginsForVariant(variant);

        console.log(chalk.white('Available plugins:\n'));

        for (const plugin of plugins) {
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
