import { createInstallPluginCommand } from '@/src/commands/plugins/install/install-plugin.command';
import { createListPluginsCommand } from '@/src/commands/plugins/list/list-plugins.command';
import { createUpdatePluginCommand } from '@/src/commands/plugins/update/update-plugin.command';
import { Workspace } from '@/src/utils/workspace';
import { Command } from 'commander';

export const pluginsCommand = new Command()
  .name('plugins')
  .description('List and install plugins.')
  .hook('preAction', () => {
    return Workspace.logWorkspaceInfo();
  });

// set children commands
createListPluginsCommand(pluginsCommand);
createInstallPluginCommand(pluginsCommand);
createUpdatePluginCommand(pluginsCommand);
