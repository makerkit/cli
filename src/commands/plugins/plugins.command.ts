import { createInstallPluginCommand } from '@/src/commands/plugins/install/install-plugin.command';
import { createListPluginsCommand } from '@/src/commands/plugins/list/list-plugins.command';
import { createUpdatePluginCommand } from '@/src/commands/plugins/update/update-plugin.command';
import { Command } from 'commander';

export const pluginsCommand = new Command()
  .name('plugins')
  .description('List and install plugins.');

// set children commands
createListPluginsCommand(pluginsCommand);
createInstallPluginCommand(pluginsCommand);
createUpdatePluginCommand(pluginsCommand);
