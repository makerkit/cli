import { join } from 'path';

import {
  PluginRegistry,
  type PluginDefinition,
  getPath,
  isInstalled,
} from '@/src/plugins-model';
import { getOrPromptUsername } from '@/src/utils/username-cache';
import { fetchRegistryItem } from '@/src/utils/install-registry-files';
import { type Variant, validateProject } from '@/src/utils/workspace';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import ora from 'ora';

async function isOutdated(
  plugin: PluginDefinition,
  variant: Variant,
  username: string,
): Promise<boolean> {
  const item = await fetchRegistryItem(variant, plugin.id, username);
  const cwd = process.cwd();

  for (const file of item.files) {
    const localPath = join(cwd, file.target);

    if (!(await fs.pathExists(localPath))) {
      return true;
    }

    const localContent = await fs.readFile(localPath, 'utf-8');

    if (localContent !== file.content) {
      return true;
    }
  }

  return false;
}

export function createOutdatedCommand(parentCommand: Command) {
  return parentCommand
    .command('outdated')
    .description('Check installed plugins for updates.')
    .action(async () => {
      try {
        const { variant } = await validateProject();
        const registry = await PluginRegistry.load();
        const plugins = registry.getPluginsForVariant(variant);

        const installed = [];

        for (const p of plugins) {
          if (await isInstalled(p, variant)) {
            installed.push(p);
          }
        }

        if (installed.length === 0) {
          console.log(chalk.yellow('No plugins installed.'));
          return;
        }

        const username = await getOrPromptUsername();

        const spinner = ora(
          `Checking ${installed.length} plugin${installed.length > 1 ? 's' : ''} for updates...`,
        ).start();

        const outdated: PluginDefinition[] = [];

        for (const plugin of installed) {
          try {
            if (await isOutdated(plugin, variant, username)) {
              outdated.push(plugin);
            }
          } catch {
            // skip plugins that fail to fetch
          }
        }

        spinner.stop();

        if (outdated.length === 0) {
          console.log(chalk.green('All plugins are up to date.'));
          return;
        }

        console.log(
          chalk.yellow(
            `\n${outdated.length} plugin${outdated.length > 1 ? 's have' : ' has'} updates available:\n`,
          ),
        );

        for (const plugin of outdated) {
          const pluginPath = getPath(plugin, variant);

          console.log(
            `  ${chalk.cyan(plugin.name)} ${chalk.gray(`(${plugin.id})`)}${pluginPath ? chalk.gray(` — ${pluginPath}`) : ''}`,
          );
        }

        console.log(
          `\nRun ${chalk.cyan('makerkit plugins diff <plugin-id>')} to see what changed.`,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';

        console.error(chalk.red(`Error: ${message}`));
        process.exit(1);
      }
    });
}
