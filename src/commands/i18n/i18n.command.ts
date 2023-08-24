import {
  createTranslateI18nCommand,
  createVerifyI18nCommand,
} from '@/src/commands/i18n/translate/translate.command';
import { Command } from 'commander';

export const i18nCommand = new Command()
  .name('i18n')
  .description('Manage and translate your i18n files');

// set children commands
createTranslateI18nCommand(i18nCommand);
createVerifyI18nCommand(i18nCommand);
