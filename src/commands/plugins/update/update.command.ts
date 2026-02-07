import { dirname, join } from 'path';

import {
  PluginRegistry,
  isInstalled,
} from '@/src/plugins-model';
import { getOrPromptUsername } from '@/src/utils/username-cache';
import { fetchRegistryItem } from '@/src/utils/install-registry-files';
import { validateProject } from '@/src/utils/workspace';
import chalk from 'chalk';
import { Command } from 'commander';
import { execaCommand } from 'execa';
import fs from 'fs-extra';
import ora from 'ora';
import prompts from 'prompts';

export function createUpdateCommand(parentCommand: Command) {
  return parentCommand
    .command('update')
    .argument('[plugin-id...]', 'Plugins to update (e.g. feedback waitlist)')
    .description('Update installed plugins to the latest registry version.')
    .action(async (pluginIds?: string[]) => {
      try {
        const { variant } = await validateProject();
        const registry = await PluginRegistry.load();

        if (!pluginIds || pluginIds.length === 0) {
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

          const response = await prompts({
            type: 'multiselect',
            name: 'pluginIds',
            message: 'Select plugins to update',
            choices: installed.map((p) => ({
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
          const plugin = registry.validatePlugin(pluginId, variant);

          if (!(await isInstalled(plugin, variant))) {
            console.log(
              chalk.yellow(
                `Plugin "${plugin.name}" is not installed. Use "plugins add ${pluginId}" to install it.`,
              ),
            );

            continue;
          }

          const spinner = ora(`Fetching latest ${plugin.name} files...`).start();
          const item = await fetchRegistryItem(variant, pluginId, username);
          spinner.succeed(`Fetched latest ${plugin.name} files.`);

          const cwd = process.cwd();
          const modifiedFiles: string[] = [];

          for (const file of item.files) {
            const localPath = join(cwd, file.target);

            if (await fs.pathExists(localPath)) {
              const localContent = await fs.readFile(localPath, 'utf-8');

              if (localContent !== file.content) {
                modifiedFiles.push(file.target);
              }
            }
          }

          if (modifiedFiles.length === 0) {
            console.log(chalk.green(`${plugin.name} is already up to date.`));
            continue;
          }

          console.log(
            chalk.yellow(
              `\n${modifiedFiles.length} file${modifiedFiles.length > 1 ? 's' : ''} will be overwritten:`,
            ),
          );

          for (const file of modifiedFiles) {
            console.log(`  ${chalk.gray(file)}`);
          }

          const { confirm } = await prompts({
            type: 'confirm',
            name: 'confirm',
            message: `Update ${plugin.name}? Local changes will be lost.`,
            initial: false,
          });

          if (!confirm) {
            console.log(chalk.gray(`Skipped ${plugin.name}.`));
            continue;
          }

          const writeSpinner = ora(`Updating ${plugin.name}...`).start();

          for (const file of item.files) {
            const targetPath = join(cwd, file.target);

            await fs.ensureDir(dirname(targetPath));
            await fs.writeFile(targetPath, file.content);
          }

          if (item.dependencies && Object.keys(item.dependencies).length > 0) {
            const deps = Object.entries(item.dependencies)
              .map(([name, version]) => `${name}@${version}`)
              .join(' ');

            await execaCommand(`pnpm add ${deps}`, { stdio: 'inherit' });
          }

          writeSpinner.succeed(`${plugin.name} updated.`);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';

        console.error(chalk.red(`Error: ${message}`));
        process.exit(1);
      }
    });
}
