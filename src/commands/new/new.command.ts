import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import prompts from 'prompts';

import { createProject } from '@/src/utils/create-project';
import { VARIANT_CATALOG } from '@/src/utils/list-variants';

export const newCommand = new Command()
  .name('new')
  .description('Initialize a new Makerkit project')
  .action(async () => {
    const choices = VARIANT_CATALOG.map((v) => ({
      title: v.name,
      value: v.id,
    }));

    const { kit, name: projectName } = await prompts([
      {
        type: 'select',
        name: 'kit',
        message: `Select the ${chalk.cyan(`SaaS Kit`)} you want to clone`,
        choices,
      },
      {
        type: 'text',
        name: 'name',
        message: `Enter your ${chalk.cyan('Project Name')}.`,
      },
    ]);

    const selected = VARIANT_CATALOG.find((v) => v.id === kit);

    if (!selected) {
      console.log('Invalid kit selection. Aborting...');
      process.exit(1);
    }

    const { confirm } = await prompts([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to clone ${chalk.cyan(
          selected.name
        )} to ${chalk.cyan(projectName)}?`,
      },
    ]);

    if (!confirm) {
      console.log('Aborting...');
      process.exit(0);
    }

    const spinner = ora(`Cloning ${selected.name}...`).start();

    try {
      const result = await createProject({
        variant: selected.id,
        name: projectName,
        directory: process.cwd(),
      });

      spinner.succeed(`${result.message}`);

      console.log(
        `You can now get started. Open the project in your IDE and read the README.md file for more information.`
      );
    } catch (e) {
      console.error(e);
      spinner.fail(`Failed to create project`);
      process.exit(1);
    }
  });
