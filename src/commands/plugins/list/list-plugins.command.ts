import { PluginRegistry, isInstalled } from '@/src/plugins-model';
import { detectVariant } from '@/src/utils/workspace';
import chalk from 'chalk';
import { Command } from 'commander';

export function createListPluginsCommand(parentCommand: Command) {
  return parentCommand
    .command('list')
    .description('List available and installed plugins.')
    .action(async () => {
      const variant = await detectVariant();
      const registry = await PluginRegistry.load();
      const plugins = registry.getPluginsForVariant(variant);

      console.log(
        chalk.white(`MakerKit Plugins ${chalk.gray(`(${variant})`)}\n`),
      );

      console.log(
        `  ${chalk.green('Plugin Name')} ${chalk.gray('(plugin-id)')} — Status\n`,
      );

      let installedCount = 0;

      for (const plugin of plugins) {
        const installed = await isInstalled(plugin, variant);

        if (installed) {
          installedCount++;
        }

        const status = installed
          ? chalk.green('installed')
          : chalk.gray('available');

        console.log(
          `  ${chalk.cyan(plugin.name)} ${chalk.gray(`(${plugin.id})`)} — ${status}`,
        );
      }

      console.log(
        `\n  ${chalk.white(`${installedCount} installed`)} / ${chalk.gray(`${plugins.length} available`)}\n`,
      );

      if (installedCount === 0) {
        console.log(
          `Run ${chalk.cyan('makerkit plugins init')} to set up the registry, then ${chalk.cyan('makerkit plugins add <plugin-id>')} to install.`,
        );
      }
    });
}
