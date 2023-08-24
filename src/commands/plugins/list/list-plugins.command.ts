import { KitsModel } from '@/src/kits-model';
import { validatePlugin } from '@/src/plugins-model';
import chalk from 'chalk';
import { Command } from 'commander';

export function createListPluginsCommand(parentCommand: Command) {
  return parentCommand
    .command('list')
    .description('List available plugins.')
    .action(() => {
      const kits = Object.values(KitsModel);

      for (const kit of kits) {
        console.log(`${chalk.cyan(kit.name)}`);

        if (!kit.plugins.length) {
          console.log(chalk.yellow(`- No plugins available`) + '\n');

          continue;
        }

        for (const plugin of kit.plugins) {
          const { name } = validatePlugin(plugin);
          console.log(`- ${chalk.green(name)}`);
        }

        console.log('');
      }
    });
}
