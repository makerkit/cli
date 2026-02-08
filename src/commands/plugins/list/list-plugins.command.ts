import { listPlugins } from '@/src/utils/list-plugins';
import chalk from 'chalk';
import { Command } from 'commander';

export function createListPluginsCommand(parentCommand: Command) {
  return parentCommand
    .command('list')
    .description('List available and installed plugins.')
    .action(async () => {
      const result = await listPlugins({ projectPath: process.cwd() });

      console.log(
        chalk.white(`MakerKit Plugins ${chalk.gray(`(${result.variant})`)}\n`),
      );

      console.log(
        `  ${chalk.green('Plugin Name')} ${chalk.gray('(plugin-id)')} — Status\n`,
      );

      let installedCount = 0;

      for (const plugin of result.plugins) {
        if (plugin.installed) {
          installedCount++;
        }

        const status = plugin.installed
          ? chalk.green('installed')
          : chalk.gray('available');

        console.log(
          `  ${chalk.cyan(plugin.name)} ${chalk.gray(`(${plugin.id})`)} — ${status}`,
        );
      }

      console.log(
        `\n  ${chalk.white(`${installedCount} installed`)} / ${chalk.gray(`${result.plugins.length} available`)}\n`,
      );

      if (installedCount === 0) {
        console.log(
          `Run ${chalk.cyan('makerkit plugins init')} to set up the registry, then ${chalk.cyan('makerkit plugins add <plugin-id>')} to install.`,
        );
      }
    });
}
