#!/usr/bin/env node
import { i18nCommand } from '@/src/commands/i18n/i18n.command';
import { pluginsCommand } from '@/src/commands/plugins/plugins.command';
import { Workspace } from '@/src/utils/workspace';
import chalk from 'chalk';
import { Command } from 'commander';
import { config } from 'dotenv';

config({
  path: '.env.local',
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

async function main() {
  const program = new Command()
    .name('makerkit')
    .description(
      'Your SaaS Kit companion. Add plugins, manage migrations, and more.'
    )
    .version('-v, --version', 'display the version number');

  const meta = await Workspace.getKitMeta();

  logKitVersion(meta.name, meta.version);

  program.addCommand(pluginsCommand).addCommand(i18nCommand);
  program.parse();
}

void main();

function logKitVersion(name: string, version: unknown) {
  console.log(
    `Makerkit version: ${chalk.cyan(name)} - ${chalk.cyan(version)}.\n`
  );
}
