import { validateKit } from '@/src/kits-model';
import { PluginsModel, validatePlugin } from '@/src/plugins-model';
import { Workspace } from '@/src/utils/workspace';
import chalk from 'chalk';
import { execaCommand } from 'execa';
import ora from 'ora';
import prompts from 'prompts';

enum PluginAction {
  Add = 'add',
  Pull = 'pull',
}

export class PluginsService {
  static async install(pluginId?: string) {
    const action = PluginAction.Add;
    const plugin = pluginId || (await getPluginFromPrompts(action));

    await initPluginCommand(plugin, action);
  }

  static async pull(pluginId?: string) {
    const action = PluginAction.Pull;
    const plugin = pluginId || (await getPluginFromPrompts(action));

    await initPluginCommand(plugin, action);
  }
}

async function initPluginCommand(pluginId: string, action: PluginAction) {
  const { id: kitId } = await Workspace.getKitMeta();

  const plugin = validatePlugin(pluginId);
  const kit = validateKit(kitId);

  if (!(kit.plugins as string[]).includes(plugin.id)) {
    throw new Error(
      `Plugin ${plugin.name} is not compatible with kit ${kit.name}`
    );
  }

  const repository = buildPluginRepositoryName(kit.repository);
  const verb = action === PluginAction.Add ? 'Installing' : 'Updating';

  console.log(
    `${verb} ${chalk.cyan(plugin.name)} to kit ${chalk.cyan(
      kit.name
    )} using repo: ${repository} ...`
  );

  return executePluginCommand({
    action,
    repository,
    branch: plugin.branch,
    folder: plugin.folder,
  });
}

async function getPluginFromPrompts(action: PluginAction) {
  const kit = await Workspace.getKitMeta();

  const choices = Object.values(PluginsModel)
    .filter((plugin) => {
      return kit.plugins.includes(plugin.id);
    })
    .map((plugin) => {
      return {
        title: plugin.name,
        value: plugin.id,
      };
    });

  const verb = action === PluginAction.Add ? 'install' : 'update';

  const { plugin } = await prompts([
    {
      type: 'select',
      name: 'plugin',
      message: `Which ${chalk.cyan('Plugin')} would you like to ${verb}?`,
      choices,
    },
  ]);

  return plugin;
}

// the plugin repository name is the kit repository name + `-plugins`
function buildPluginRepositoryName(repository: string) {
  return repository + `-plugins.git`;
}

async function executePluginCommand({
  action,
  repository,
  branch,
  folder,
}: {
  action: PluginAction;
  repository: string;
  branch: string;
  folder: string;
}) {
  const verb = action === PluginAction.Add ? 'Installing' : 'Updating';
  const spinner = ora(`${verb} plugin...`).start();
  const commandString = `git subtree ${action} --prefix ${folder} ${repository} ${branch} --squash`;

  try {
    await execaCommand(commandString);

    const verb = action === PluginAction.Add ? 'installed' : 'updated';
    spinner.succeed(`Plugin ${verb} at ${folder}`);
  } catch (e) {
    console.error(e);

    const verb = action === PluginAction.Add ? 'installation' : 'update';
    spinner.fail(`Plugin ${verb} failed`);
  }
}
