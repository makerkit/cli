#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from 'dotenv';
import { z } from 'zod/v3';

import {
  PluginRegistry,
  getEnvVars,
  isInstalled,
} from '@/src/plugins-model';
import {
  cacheUsername,
  getCachedUsername,
} from '@/src/utils/username-cache';
import { installRegistryFiles } from '@/src/utils/install-registry-files';
import { appendEnvVars } from '@/src/utils/env-vars';
import { isGitClean } from '@/src/utils/git';
import { runCodemod } from '@/src/utils/run-codemod';
import { detectVariant, validateProject } from '@/src/utils/workspace';

config({ path: '.env.local' });

async function withProjectDir<T>(
  projectPath: string,
  fn: () => Promise<T>,
): Promise<T> {
  const original = process.cwd();

  try {
    process.chdir(projectPath);
    return await fn();
  } finally {
    process.chdir(original);
  }
}

function textContent(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function errorContent(message: string) {
  return { content: [{ type: 'text' as const, text: message }], isError: true };
}

const server = new McpServer({
  name: 'makerkit',
  version: '2.0.0',
});

server.registerTool(
  'makerkit_status',
  {
    description: 'Project introspection: detect variant, git status, registry config, and plugin install status',
    inputSchema: {
      projectPath: z.string().describe('Absolute path to the MakerKit project root'),
    },
  },
  async ({ projectPath }) => {
    try {
      return await withProjectDir(projectPath, async () => {
        const { variant, version } = await validateProject();
        const gitClean = await isGitClean();
        const registryConfigured = !!getCachedUsername();
        const registry = await PluginRegistry.load();
        const plugins = registry.getPluginsForVariant(variant);

        const pluginStatuses = await Promise.all(
          plugins.map(async (p) => ({
            id: p.id,
            name: p.name,
            installed: await isInstalled(p, variant),
          })),
        );

        return textContent(
          JSON.stringify(
            { variant, version, gitClean, registryConfigured, plugins: pluginStatuses },
            null,
            2,
          ),
        );
      });
    } catch (error) {
      return errorContent(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

server.registerTool(
  'makerkit_list_plugins',
  {
    description: 'List all available plugins for the detected project variant with install status and metadata',
    inputSchema: {
      projectPath: z.string().describe('Absolute path to the MakerKit project root'),
    },
  },
  async ({ projectPath }) => {
    try {
      return await withProjectDir(projectPath, async () => {
        const variant = await detectVariant();
        const registry = await PluginRegistry.load();
        const plugins = registry.getPluginsForVariant(variant);

        const pluginList = await Promise.all(
          plugins.map(async (p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            installed: await isInstalled(p, variant),
            envVars: getEnvVars(p, variant).map((e) => e.key),
            postInstallMessage: p.postInstallMessage ?? null,
          })),
        );

        return textContent(JSON.stringify({ variant, plugins: pluginList }, null, 2));
      });
    } catch (error) {
      return errorContent(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

server.registerTool(
  'makerkit_add_plugin',
  {
    description: 'Install a MakerKit plugin: runs codemod, adds env vars, and returns structured result',
    inputSchema: {
      projectPath: z.string().describe('Absolute path to the MakerKit project root'),
      pluginId: z.string().describe('Plugin identifier (e.g. feedback, waitlist, posthog)'),
      githubUsername: z.string().optional().describe('GitHub username for registry auth (skips interactive prompt)'),
    },
  },
  async ({ projectPath, pluginId, githubUsername }) => {
    try {
      return await withProjectDir(projectPath, async () => {
        // 1. Check git is clean
        const gitClean = await isGitClean();

        if (!gitClean) {
          return errorContent(
            'Git working directory has uncommitted changes. Please commit or stash them before adding a plugin.',
          );
        }

        // 2. Validate project and detect variant
        const { variant } = await validateProject();

        // 3. Resolve username
        const username = githubUsername?.trim() || getCachedUsername();

        if (!username) {
          return errorContent(
            'No GitHub username cached and none provided. ' +
              'Call makerkit_init_registry first or pass githubUsername.',
          );
        }

        cacheUsername(username);

        // 4. Load registry and validate plugin
        const registry = await PluginRegistry.load();
        const plugin = registry.validatePlugin(pluginId, variant);

        // 5. Check if already installed
        if (await isInstalled(plugin, variant)) {
          return errorContent(`Plugin "${plugin.name}" is already installed.`);
        }

        // 6. Fetch and write plugin files from registry
        await installRegistryFiles(variant, pluginId, username);

        // 7. Run codemod with captured output
        const codemodResult = await runCodemod(variant, pluginId, { captureOutput: true });

        if (!codemodResult.success) {
          return errorContent(
            `Plugin installation failed during codemod.\n${codemodResult.output}\nTo revert: git checkout . && git clean -fd`,
          );
        }

        // 8. Add env vars
        const envVars = getEnvVars(plugin, variant);

        if (envVars.length > 0) {
          await appendEnvVars(envVars, plugin.name);
        }

        // 9. Return structured result
        return textContent(
          JSON.stringify(
            {
              success: true,
              pluginName: plugin.name,
              pluginId: plugin.id,
              variant,
              envVarsAdded: envVars.map((e) => e.key),
              postInstallMessage: plugin.postInstallMessage ?? null,
              codemodOutput: codemodResult.output,
            },
            null,
            2,
          ),
        );
      });
    } catch (error) {
      return errorContent(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

server.registerTool(
  'makerkit_init_registry',
  {
    description: 'Cache the GitHub username used for MakerKit plugin registry authentication',
    inputSchema: {
      projectPath: z.string().describe('Absolute path to the MakerKit project root'),
      githubUsername: z.string().describe('GitHub username registered with your MakerKit account'),
    },
  },
  async ({ projectPath, githubUsername }) => {
    try {
      return await withProjectDir(projectPath, async () => {
        const variant = await detectVariant();

        cacheUsername(githubUsername);

        return textContent(
          JSON.stringify(
            {
              success: true,
              variant,
              username: githubUsername,
            },
            null,
            2,
          ),
        );
      });
    } catch (error) {
      return errorContent(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();

  await server.connect(transport);
}

void main();
