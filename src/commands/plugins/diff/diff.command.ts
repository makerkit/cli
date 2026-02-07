import { dirname, join } from 'path';
import { tmpdir } from 'os';

import {
  PluginRegistry,
  isInstalled,
} from '@/src/plugins-model';
import { getOrPromptUsername } from '@/src/utils/username-cache';
import { fetchRegistryItem } from '@/src/utils/install-registry-files';
import { validateProject } from '@/src/utils/workspace';
import chalk from 'chalk';
import { Command } from 'commander';
import { execa } from 'execa';
import fs from 'fs-extra';
import ora from 'ora';
import prompts from 'prompts';

export function createDiffCommand(parentCommand: Command) {
  return parentCommand
    .command('diff')
    .argument('[plugin-id]', 'Plugin to diff (e.g. feedback, waitlist)')
    .description('Show differences between installed plugin files and the latest registry version.')
    .action(async (pluginId?: string) => {
      try {
        const { variant } = await validateProject();
        const registry = await PluginRegistry.load();

        if (!pluginId) {
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
            type: 'select',
            name: 'pluginId',
            message: 'Select a plugin to diff',
            choices: installed.map((p) => ({
              title: `${p.name} ${chalk.gray(`(${p.id})`)}`,
              value: p.id,
            })),
          });

          pluginId = response.pluginId as string | undefined;

          if (!pluginId) {
            return;
          }
        }

        const plugin = registry.validatePlugin(pluginId, variant);

        if (!(await isInstalled(plugin, variant))) {
          console.error(
            chalk.yellow(`Plugin "${plugin.name}" is not installed.`),
          );

          return;
        }

        const username = await getOrPromptUsername();

        const spinner = ora('Fetching latest plugin files...').start();
        const item = await fetchRegistryItem(variant, pluginId, username);
        spinner.succeed('Fetched latest plugin files.');

        const tempDir = join(tmpdir(), `makerkit-diff-${pluginId}`);
        await fs.ensureDir(tempDir);

        try {
          const cwd = process.cwd();
          let hasDiff = false;

          for (const file of item.files) {
            const localPath = join(cwd, file.target);
            const remotePath = join(tempDir, file.target);

            await fs.ensureDir(dirname(join(tempDir, file.target)));
            await fs.writeFile(remotePath, file.content);

            if (!(await fs.pathExists(localPath))) {
              console.log(chalk.green(`\nNew file: ${file.target}`));
              hasDiff = true;

              continue;
            }

            const localContent = await fs.readFile(localPath, 'utf-8');

            if (localContent !== file.content) {
              hasDiff = true;

              console.log(chalk.white(`\n--- ${file.target}`));

              await execa('git', ['diff', '--no-index', '--color', '--', localPath, remotePath], {
                stdio: 'inherit',
                reject: false,
              });
            }
          }

          if (!hasDiff) {
            console.log(
              chalk.green(`\n${plugin.name} is up to date.`),
            );
          }
        } finally {
          await fs.remove(tempDir);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';

        console.error(chalk.red(`Error: ${message}`));
        process.exit(1);
      }
    });
}
