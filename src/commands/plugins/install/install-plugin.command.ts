import { PluginsService } from '@/src/commands/plugins/plugins-service';
import { Command } from 'commander';

export function createInstallPluginCommand(parentCommand: Command) {
  return parentCommand
    .command('install')
    .argument('[plugin-id]', 'Plugin id')
    .description('Install plugin')
    .action(async (maybePluginId) => {
      await PluginsService.install(maybePluginId);
    });
}
