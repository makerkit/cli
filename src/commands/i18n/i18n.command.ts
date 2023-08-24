import { createTranslateI18nCommand } from '@/src/commands/i18n/translate/translate.command';
import { createVerifyI18nCommand } from '@/src/commands/i18n/verify/verify.command';
import { Workspace } from '@/src/utils/workspace';
import { Command } from 'commander';

export const i18nCommand = new Command()
  .name('i18n')
  .description('Manage and translate your i18n files')
  .hook('preAction', () => {
    return Workspace.logWorkspaceInfo();
  });

// set children commands
createTranslateI18nCommand(i18nCommand);
createVerifyI18nCommand(i18nCommand);
