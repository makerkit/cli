import { PluginManager } from '@/src/commands/plugins/plugin-manager';
import { Command } from 'commander';

export function createInstallPluginCommand(parentCommand: Command) {
  return parentCommand
    .command('install')
    .argument('[plugin-id]', 'Plugin id')
    .description('Install plugin')
    .action(async (maybePluginId) => {
      await PluginManager.install(maybePluginId);
    });
}
