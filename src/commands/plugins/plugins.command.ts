import { createAddCommand } from '@/src/commands/plugins/add/add.command';
import { createDiffCommand } from '@/src/commands/plugins/diff/diff.command';
import { createInitCommand } from '@/src/commands/plugins/init/init.command';
import { createListPluginsCommand } from '@/src/commands/plugins/list/list-plugins.command';
import { createOutdatedCommand } from '@/src/commands/plugins/outdated/outdated.command';
import { createUpdateCommand } from '@/src/commands/plugins/update/update.command';
import { Command } from 'commander';

export const pluginsCommand = new Command()
  .name('plugins')
  .description('Manage MakerKit plugins.');

createInitCommand(pluginsCommand);
createAddCommand(pluginsCommand);
createUpdateCommand(pluginsCommand);
createDiffCommand(pluginsCommand);
createOutdatedCommand(pluginsCommand);
createListPluginsCommand(pluginsCommand);
