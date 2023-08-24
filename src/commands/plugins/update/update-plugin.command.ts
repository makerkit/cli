import { PluginsService } from '@/src/commands/plugins/plugins-service';
import { Command } from 'commander';

export function createUpdatePluginCommand(parentCommand: Command) {
  return parentCommand
    .command('update')
    .argument('[plugin-id]', 'Plugin id')
    .description('Update plugin to the latest version')
    .action(async (maybePluginId) => {
      await PluginsService.pull(maybePluginId);
    });
}
