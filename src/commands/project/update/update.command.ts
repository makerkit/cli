import { VARIANT_CATALOG } from '@/src/utils/list-variants';
import { projectPull } from '@/src/utils/project-pull';
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';

export function createProjectUpdateCommand(parentCommand: Command) {
  return parentCommand
    .command('update')
    .description(
      'Pull the latest changes from the upstream MakerKit repository.',
    )
    .action(async () => {
      try {
        const spinner = ora('Pulling latest changes from upstream...').start();

        const result = await projectPull({ projectPath: process.cwd() });

        if (result.success) {
          const displayName =
            VARIANT_CATALOG.find((v) => v.id === result.variant)?.name ??
            result.variant;

          if (result.alreadyUpToDate) {
            spinner.succeed(
              `Already up to date. (${chalk.cyan(displayName)})`,
            );
          } else {
            spinner.succeed(
              `Successfully pulled latest changes from upstream. (${chalk.cyan(displayName)})`,
            );
          }
        } else if ('hasConflicts' in result) {
          spinner.fail('Merge conflicts detected.');

          console.log(
            chalk.yellow(
              `\n${result.conflictCount} conflicting file(s):`,
            ),
          );

          for (const conflict of result.conflicts) {
            console.log(`  ${chalk.gray('-')} ${conflict.path}`);
          }

          console.log(
            chalk.yellow('\nPlease resolve them manually:'),
          );

          console.log(chalk.gray('  1. Fix the conflicting files'));
          console.log(chalk.gray('  2. Run: git add .'));
          console.log(chalk.gray('  3. Run: git commit'));

          process.exit(1);
        } else {
          spinner.fail('Failed to pull from upstream.');
          console.error(chalk.red(`\n${result.reason}`));
          process.exit(1);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';

        console.error(chalk.red(`Error: ${message}`));
        process.exit(1);
      }
    });
}
