import { getErrorOutput } from '@/src/utils/git';
import {
  getUpstreamRemoteUrl,
  getUpstreamUrl,
  hasSshAccess,
  isUpstreamUrlValid,
  setUpstreamRemote,
} from '@/src/utils/upstream';
import { validateProject } from '@/src/utils/workspace';
import chalk from 'chalk';
import { Command } from 'commander';
import { execaCommand } from 'execa';
import ora from 'ora';
import prompts from 'prompts';

const VARIANT_DISPLAY_NAME: Record<string, string> = {
  'next-supabase': 'Next.js Supabase',
  'next-drizzle': 'Next.js Drizzle',
  'next-prisma': 'Next.js Prisma',
  'react-router-supabase': 'React Router Supabase',
};

export function createProjectUpdateCommand(parentCommand: Command) {
  return parentCommand
    .command('update')
    .description(
      'Pull the latest changes from the upstream MakerKit repository.',
    )
    .action(async () => {
      try {
        const { variant } = await validateProject();
        const displayName = VARIANT_DISPLAY_NAME[variant] ?? variant;

        const currentUrl = await getUpstreamRemoteUrl();

        if (!currentUrl) {
          // No upstream remote — detect SSH and offer to add it
          const sshSpinner = ora('Checking SSH access to GitHub...').start();
          const useSsh = await hasSshAccess();

          if (useSsh) {
            sshSpinner.succeed('SSH access to GitHub detected.');
          } else {
            sshSpinner.warn(
              'SSH access to GitHub not available. Using HTTPS URL.',
            );
          }

          const expectedUrl = getUpstreamUrl(variant, useSsh);

          console.log(
            chalk.yellow('Upstream remote not configured.') +
              ` Detected kit: ${chalk.cyan(displayName)}`,
          );

          console.log(`Default URL: ${chalk.gray(expectedUrl)}`);

          const { confirm } = await prompts({
            type: 'confirm',
            name: 'confirm',
            message: 'Add upstream remote with this URL?',
            initial: true,
          });

          if (!confirm) {
            console.log('Aborted.');
            return;
          }

          await setUpstreamRemote(expectedUrl);

          console.log(chalk.green('Upstream remote added.'));
        } else if (!isUpstreamUrlValid(currentUrl, variant)) {
          // Upstream exists but points to the wrong repo entirely
          const useSsh = currentUrl.startsWith('git@');
          const expectedUrl = getUpstreamUrl(variant, useSsh);

          console.log(
            chalk.yellow(
              'Upstream remote URL does not match the expected repository.',
            ),
          );

          console.log(`  Current:  ${chalk.gray(currentUrl)}`);
          console.log(`  Expected: ${chalk.gray(expectedUrl)}`);

          const { update } = await prompts({
            type: 'confirm',
            name: 'update',
            message: `Update upstream URL to ${expectedUrl}?`,
            initial: true,
          });

          if (update) {
            await setUpstreamRemote(expectedUrl);
            console.log(chalk.green('Upstream remote URL updated.'));
          }
        }

        const spinner = ora('Pulling latest changes from upstream...').start();

        try {
          await execaCommand('git fetch upstream');

          const { stdout } = await execaCommand(
            'git merge upstream/main --no-edit',
          );

          if (stdout.includes('Already up to date')) {
            spinner.succeed('Already up to date.');
          } else {
            spinner.succeed(
              'Successfully pulled latest changes from upstream.',
            );
          }
        } catch (error) {
          spinner.fail('Failed to pull from upstream.');

          const output = getErrorOutput(error);

          if (
            output.includes('CONFLICT') ||
            output.includes('Automatic merge failed')
          ) {
            console.log(
              chalk.yellow(
                '\nMerge conflicts detected. Please resolve them manually:',
              ),
            );

            console.log(chalk.gray('  1. Fix the conflicting files'));
            console.log(chalk.gray('  2. Run: git add .'));
            console.log(chalk.gray('  3. Run: git commit'));
          } else {
            console.error(chalk.red(`\n${output}`));
          }

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
