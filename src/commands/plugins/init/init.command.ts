import { PluginRegistry } from '@/src/plugins-model';
import { addMakerkitRegistry } from '@/src/utils/components-json';
import { detectVariant } from '@/src/utils/workspace';
import chalk from 'chalk';
import { Command } from 'commander';
import prompts from 'prompts';

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

        const { licenseKey } = await prompts({
          type: 'text',
          name: 'licenseKey',
          message: 'Enter your MakerKit license key:',
          validate: (value: string) =>
            value.trim().length > 0 || 'License key is required',
        });

        if (!licenseKey) {
          console.log(chalk.yellow('Setup cancelled.'));
          return;
        }

        await addMakerkitRegistry(variant, licenseKey.trim());

        console.log(
          chalk.green('Registry configured in components.json.\n'),
        );

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
