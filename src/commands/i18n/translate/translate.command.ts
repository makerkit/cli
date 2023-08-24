import { TranslateManager } from '@/src/commands/i18n/translate/translate-manager';
import chalk from 'chalk';
import { Command } from 'commander';
import prompts from 'prompts';

export function createTranslateI18nCommand(parentCommand: Command) {
  return parentCommand
    .command('translate')
    .argument('[source-locale]', 'Source Locale')
    .argument('[target-locale]', 'Target Locale')
    .description('Translate i18n files from source locale to target locale')
    .action(async (sourceLocale, targetLocale) => {
      const locales = await promptLocales(sourceLocale, targetLocale);

      await TranslateManager.translate(
        locales.sourceLocale,
        locales.targetLocale
      );
    });
}

export function createVerifyI18nCommand(parentCommand: Command) {
  return parentCommand
    .command('verify')
    .argument('[base-locale]', 'Base Locale')
    .description(
      'Verify i18n files have no missing keys compared to base locale'
    )
    .action(async (baseLocale) => {
      await TranslateManager.verify(baseLocale || 'en');
    });
}

async function promptLocales(maybeSource?: string, maybeTarget?: string) {
  const hint = 'e.g. en, fr, es, etc.';

  const sourceLocale =
    maybeSource ||
    (
      await prompts([
        {
          type: 'text',
          name: 'locale',
          message: `Enter your ${chalk.cyan('Source Locale')}. ${hint}`,
          hint,
        },
      ])
    ).locale;

  const targetLocale =
    maybeTarget ||
    (
      await prompts([
        {
          type: 'text',
          name: 'locale',
          message: `Enter your ${chalk.cyan('Target Locale')}. ${hint}`,
          hint,
        },
      ])
    ).locale;

  return {
    sourceLocale,
    targetLocale,
  };
}
