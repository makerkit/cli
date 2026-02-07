import { PluginsModel } from '@/src/plugins-model';
import { readManifest } from '@/src/utils/manifest';
import chalk from 'chalk';
import { Command } from 'commander';

export function createListPluginsCommand(parentCommand: Command) {
  return parentCommand
    .command('list')
    .description('List available and installed plugins.')
    .action(async () => {
      const manifest = await readManifest();
      const installedMap = new Map(
        manifest.plugins.map((p) => [p.pluginId, p]),
      );

      const plugins = Object.values(PluginsModel);

      console.log(chalk.white('MakerKit Plugins\n'));
      console.log(
        `  ${chalk.green('Plugin Name')} ${chalk.gray('(plugin-id)')} — Status\n`,
      );

      for (const plugin of plugins) {
        const installed = installedMap.get(plugin.id);

        const status = installed
          ? chalk.green(`installed`) +
            (installed.version !== 'unknown'
              ? chalk.gray(` v${installed.version}`)
              : '') +
            (installed.source ? chalk.gray(` [${installed.source}]`) : '')
          : chalk.gray('available');

        console.log(
          `  ${chalk.cyan(plugin.name)} ${chalk.gray(`(${plugin.id})`)} — ${status}`,
        );
      }

      const installedCount = manifest.plugins.length;

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
