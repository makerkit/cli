import { createActivateLicenseCommand } from '@/src/commands/license/activate/activate-license.command';
import { Command } from 'commander';

export const licenseCommand = new Command()
  .name('license')
  .description('Manage Licenses');

createActivateLicenseCommand(licenseCommand);
