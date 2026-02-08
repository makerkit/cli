#!/usr/bin/env node
import { newCommand } from '@/src/commands/new/new.command';
import { pluginsCommand } from '@/src/commands/plugins/plugins.command';
import { projectCommand } from '@/src/commands/project/project.command';
import { Command } from 'commander';
import { config } from 'dotenv';

import { CLI_VERSION } from '@/src/version';

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
    .version(CLI_VERSION, '-v, --version', 'display the version number');

  program.addCommand(newCommand).addCommand(pluginsCommand).addCommand(projectCommand);

  program.parse();
}

void main();
