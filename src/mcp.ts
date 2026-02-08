#!/usr/bin/env node
import path from 'path';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from 'dotenv';
import { z } from 'zod/v3';

import { addPlugin } from '@/src/utils/add-plugin';
import { applyPluginUpdate } from '@/src/utils/apply-plugin-update';
import { checkPluginUpdate } from '@/src/utils/check-plugin-update';
import { createProject } from '@/src/utils/create-project';
import { getProjectStatus } from '@/src/utils/get-project-status';
import { initRegistry } from '@/src/utils/init-registry';
import { listPlugins } from '@/src/utils/list-plugins';
import { listVariants, VARIANT_CATALOG } from '@/src/utils/list-variants';
import { projectPull } from '@/src/utils/project-pull';
import { resolveConflicts } from '@/src/utils/resolve-conflicts';
import { withProjectDir } from '@/src/utils/with-project-dir';
import type { Variant } from '@/src/utils/workspace';
import { CLI_VERSION } from '@/src/version';

config({ path: '.env.local' });

function textContent(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function errorContent(message: string) {
  return { content: [{ type: 'text' as const, text: message }], isError: true };
}

const server = new McpServer({
  name: 'makerkit-cli',
  version: CLI_VERSION,
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
      const result = await withProjectDir(projectPath, () => getProjectStatus({ projectPath }));
      return textContent(JSON.stringify(result, null, 2));
    } catch (error) {
      return errorContent(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

server.registerTool(
  'makerkit_list_variants',
  {
    description: 'List available MakerKit kit variants with metadata for the project creation wizard',
    inputSchema: {},
  },
  async () => {
    try {
      return textContent(JSON.stringify(listVariants(), null, 2));
    } catch (error) {
      return errorContent(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

server.registerTool(
  'makerkit_create_project',
  {
    description:
      'Create a new MakerKit project: clones the selected kit variant, installs dependencies, and writes a .makerkit/config.json marker file.',
    inputSchema: {
      variant: z
        .enum(VARIANT_CATALOG.map((v) => v.id) as [Variant, ...Variant[]])
        .describe('Kit variant to create'),
      name: z.string().min(1).describe('Project directory name'),
      directory: z
        .string()
        .describe('Absolute path to the parent directory where the project will be created'),
      github_token: z
        .string()
        .optional()
        .describe('Optional GitHub PAT for HTTPS cloning (token is stripped from remote after clone)'),
    },
  },
  async ({ variant, name, directory, github_token }) => {
    try {
      if (!path.isAbsolute(directory)) {
        return errorContent(
          `"directory" must be an absolute path. Received: "${directory}"`,
        );
      }

      const result = await createProject({
        variant,
        name,
        directory,
        githubToken: github_token,
      });

      return textContent(
        JSON.stringify(
          {
            success: result.success,
            project_path: result.projectPath,
            variant: result.variant,
            message: result.message,
          },
          null,
          2,
        ),
      );
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
      const result = await withProjectDir(projectPath, () => listPlugins({ projectPath }));
      return textContent(JSON.stringify(result, null, 2));
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
      skipGitCheck: z.boolean().optional().describe('Skip git clean check (useful when installing multiple plugins in sequence)'),
    },
  },
  async ({ projectPath, pluginId, githubUsername, skipGitCheck }) => {
    try {
      const result = await withProjectDir(projectPath, () =>
        addPlugin({ projectPath, pluginId, githubUsername, skipGitCheck }),
      );

      if (!result.success) {
        return errorContent(result.reason);
      }

      return textContent(JSON.stringify(result, null, 2));
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
      const result = await withProjectDir(projectPath, () =>
        initRegistry({ projectPath, githubUsername }),
      );

      return textContent(JSON.stringify(result, null, 2));
    } catch (error) {
      return errorContent(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

server.registerTool(
  'makerkit_check_update',
  {
    description:
      'Analyze a plugin update using three-way diff (base/local/remote). Returns per-file status and content for AI-powered merge resolution.',
    inputSchema: {
      projectPath: z.string().describe('Absolute path to the MakerKit project root'),
      pluginId: z.string().describe('Plugin identifier (e.g. feedback, waitlist)'),
      githubUsername: z
        .string()
        .optional()
        .describe('GitHub username for registry auth (uses cached if omitted)'),
    },
  },
  async ({ projectPath, pluginId, githubUsername }) => {
    try {
      const result = await withProjectDir(projectPath, () =>
        checkPluginUpdate({ projectPath, pluginId, githubUsername }),
      );

      if (!result.success) {
        return errorContent(result.reason);
      }

      return textContent(
        JSON.stringify(
          {
            ...result,
            note: 'For conflict files, produce a merged version and pass it to makerkit_apply_update.',
          },
          null,
          2,
        ),
      );
    } catch (error) {
      return errorContent(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

server.registerTool(
  'makerkit_apply_update',
  {
    description:
      'Apply AI-resolved plugin update files. Writes merged content to disk and updates base versions for future three-way merges.',
    inputSchema: {
      projectPath: z.string().describe('Absolute path to the MakerKit project root'),
      pluginId: z.string().describe('Plugin identifier'),
      files: z
        .array(
          z.object({
            path: z.string().describe('File path relative to project root (from check_update)'),
            content: z.string().optional().describe('Resolved file content (required for write action)'),
            action: z
              .enum(['write', 'skip', 'delete'])
              .describe(
                'write: write content to disk, skip: keep local version, delete: remove file from disk',
              ),
          }),
        )
        .describe('Array of file resolutions'),
      installDependencies: z
        .boolean()
        .optional()
        .describe('Whether to install plugin dependencies (default true)'),
      githubUsername: z
        .string()
        .optional()
        .describe('GitHub username for registry auth (uses cached if omitted)'),
    },
  },
  async ({ projectPath, pluginId, files, installDependencies, githubUsername }) => {
    try {
      const result = await withProjectDir(projectPath, () =>
        applyPluginUpdate({ projectPath, pluginId, files, installDependencies, githubUsername }),
      );

      if (!result.success) {
        return errorContent(result.reason);
      }

      return textContent(
        JSON.stringify(
          {
            ...result,
            note: 'Base versions updated. Run makerkit_check_update again to verify all files show as unchanged.',
          },
          null,
          2,
        ),
      );
    } catch (error) {
      return errorContent(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

server.registerTool(
  'makerkit_project_pull',
  {
    description:
      'Pull latest upstream changes into a MakerKit project. Auto-detects kit variant, configures the upstream remote (SSH or HTTPS), fetches, and merges. Returns conflict details with base/local/remote content when merge conflicts occur so the AI can resolve them. After resolving, call makerkit_project_resolve_conflicts.',
    inputSchema: {
      projectPath: z
        .string()
        .describe('Absolute path to the MakerKit project root'),
    },
  },
  async ({ projectPath }) => {
    try {
      const result = await withProjectDir(projectPath, () => projectPull({ projectPath }));

      if (!result.success) {
        if ('hasConflicts' in result) {
          return textContent(JSON.stringify(result, null, 2));
        }

        return errorContent(result.reason);
      }

      return textContent(JSON.stringify(result, null, 2));
    } catch (error) {
      return errorContent(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

server.registerTool(
  'makerkit_project_resolve_conflicts',
  {
    description:
      'Resolve merge conflicts from makerkit_project_pull. Write resolved file contents, stage them, and complete the merge commit.',
    inputSchema: {
      projectPath: z
        .string()
        .describe('Absolute path to the MakerKit project root'),
      files: z
        .array(
          z.object({
            path: z
              .string()
              .describe('File path relative to project root'),
            content: z
              .string()
              .describe('Resolved file content'),
          }),
        )
        .describe('Array of resolved files'),
      commitMessage: z
        .string()
        .optional()
        .describe(
          'Custom merge commit message (defaults to auto-generated merge message)',
        ),
    },
  },
  async ({ projectPath, files, commitMessage }) => {
    try {
      const result = await withProjectDir(projectPath, () =>
        resolveConflicts({ projectPath, files, commitMessage }),
      );

      if (!result.success) {
        return textContent(JSON.stringify(result, null, 2));
      }

      return textContent(JSON.stringify(result, null, 2));
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
