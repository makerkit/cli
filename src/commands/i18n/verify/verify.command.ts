import { I18nService } from '@/src/commands/i18n/i18n-service';
import { Command } from 'commander';

export function createVerifyI18nCommand(parentCommand: Command) {
  return parentCommand
    .command('verify')
    .argument('[base-locale]', 'Base Locale')
    .description(
      'Verify i18n files have no missing keys compared to base locale'
    )
    .action(async (baseLocale = 'en') => {
      await I18nService.verify(baseLocale);
    });
}
