import { createProjectUpdateCommand } from '@/src/commands/project/update/update.command';
import { Command } from 'commander';

export const projectCommand = new Command()
  .name('project')
  .description('Manage your MakerKit project.');

createProjectUpdateCommand(projectCommand);
