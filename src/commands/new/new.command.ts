import { join } from 'path';
import { KitsModel, validateKit } from '@/src/kits-model';
import chalk from 'chalk';
import { Command } from 'commander';
import { execa } from 'execa';
import ora from 'ora';
import prompts from 'prompts';

export const newCommand = new Command()
  .name('new')
  .description('Initialize a new Makerkit project')
  .action(async () => {
    const choices = Object.values(KitsModel).map((kit) => {
      return {
        title: kit.name,
        value: kit.id,
      };
    });

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

    const { repository, name: kitName } = validateKit(kit);

    const { confirm } = await prompts([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to clone ${chalk.cyan(
          kitName
        )} to ${chalk.cyan(projectName)}?`,
      },
    ]);

    if (!confirm) {
      console.log('Aborting...');
      process.exit(0);
    }

    // pull repository from github
    await pullFromGithub(repository, kitName, projectName);

    // install dependencies
    await installDependencies(projectName);
  });

async function pullFromGithub(
  repository: string,
  kit: string,
  projectName: string
) {
  const spinner = ora(`Cloning ${kit}...`).start();

  try {
    await execa('git', ['clone', repository, projectName]);

    spinner.succeed(`Cloned ${kit} to ${projectName}...`);
  } catch (e) {
    console.error(e);
    spinner.fail(`Failed to clone ${kit}`);

    return Promise.reject(`Failed to clone ${kit}`);
  }
}

async function installDependencies(projectName: string) {
  const cwd = join(process.cwd(), projectName);
  const spinner = ora(`Installing dependencies. Please wait...`).start();

  try {
    await execa('npm', ['install'], { cwd });

    spinner.succeed(`Dependencies successfully installed!`);

    console.log(
      `🎉 You can now get started. Open the project in your IDE and read the README.md file for more information.`
    );
  } catch (e) {
    console.error(e);
    spinner.fail(`Failed to install dependencies`);

    return Promise.reject(`Failed to install dependencies`);
  }
}
