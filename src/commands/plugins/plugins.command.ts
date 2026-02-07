import { createAddCommand } from '@/src/commands/plugins/add/add.command';
import { createInitCommand } from '@/src/commands/plugins/init/init.command';
import { createListPluginsCommand } from '@/src/commands/plugins/list/list-plugins.command';
import { createScanCommand } from '@/src/commands/plugins/scan/scan.command';
import { Command } from 'commander';

export const pluginsCommand = new Command()
  .name('plugins')
  .description('Manage MakerKit plugins.');

createInitCommand(pluginsCommand);
createAddCommand(pluginsCommand);
createListPluginsCommand(pluginsCommand);
createScanCommand(pluginsCommand);
