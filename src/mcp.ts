#!/usr/bin/env node
import { dirname, join } from 'path';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from 'dotenv';
import { execa, execaCommand } from 'execa';
import fs from 'fs-extra';
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
import {
  saveBaseVersions,
  readBaseVersion,
  hasBaseVersions,
  computeFileStatus,
} from '@/src/utils/base-store';
import {
  installRegistryFiles,
  fetchRegistryItem,
} from '@/src/utils/install-registry-files';
import { appendEnvVars } from '@/src/utils/env-vars';
import { getErrorOutput, isGitClean } from '@/src/utils/git';
import { runCodemod } from '@/src/utils/run-codemod';
import {
  getUpstreamRemoteUrl,
  getUpstreamUrl,
  hasSshAccess,
  isUpstreamUrlValid,
  setUpstreamRemote,
} from '@/src/utils/upstream';
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
  name: 'makerkit-cli',
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
        const item = await installRegistryFiles(variant, pluginId, username);

        // 6b. Save base versions for three-way merge
        await saveBaseVersions(pluginId, item.files);

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
      return await withProjectDir(projectPath, async () => {
        const { variant } = await validateProject();

        const username = githubUsername?.trim() || getCachedUsername();

        if (!username) {
          return errorContent(
            'No GitHub username cached and none provided. ' +
              'Call makerkit_init_registry first or pass githubUsername.',
          );
        }

        cacheUsername(username);

        const registry = await PluginRegistry.load();
        registry.validatePlugin(pluginId, variant);

        const item = await fetchRegistryItem(variant, pluginId, username);
        const cwd = process.cwd();
        const hasBase = await hasBaseVersions(pluginId);

        const counts = {
          unchanged: 0,
          updated: 0,
          conflict: 0,
          added: 0,
          deleted_locally: 0,
          no_base: 0,
        };

        const files = await Promise.all(
          item.files.map(async (file) => {
            const localPath = join(cwd, file.target);

            let local: string | undefined;

            try {
              local = await fs.readFile(localPath, 'utf-8');
            } catch {
              local = undefined;
            }

            const base = await readBaseVersion(pluginId, file.target);
            const remote = file.content;

            const status = computeFileStatus({ base, local, remote });
            counts[status]++;

            const result: Record<string, unknown> = {
              path: file.target,
              status,
            };

            switch (status) {
              case 'unchanged':
                break;
              case 'updated':
                result.remote = remote;
                break;
              case 'conflict':
                result.base = base;
                result.local = local;
                result.remote = remote;
                break;
              case 'no_base':
                result.local = local;
                result.remote = remote;
                break;
              case 'added':
                result.remote = remote;
                break;
              case 'deleted_locally':
                result.base = base;
                result.remote = remote;
                break;
            }

            return result;
          }),
        );

        return textContent(
          JSON.stringify(
            {
              pluginId,
              variant,
              hasBaseVersions: hasBase,
              counts,
              files,
              note: 'For conflict files, produce a merged version and pass it to makerkit_apply_update.',
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
      return await withProjectDir(projectPath, async () => {
        const { variant } = await validateProject();

        const username = githubUsername?.trim() || getCachedUsername();

        if (!username) {
          return errorContent(
            'No GitHub username cached and none provided. ' +
              'Call makerkit_init_registry first or pass githubUsername.',
          );
        }

        cacheUsername(username);

        const registry = await PluginRegistry.load();
        registry.validatePlugin(pluginId, variant);

        // Fetch remote item for base saving and dependencies
        const item = await fetchRegistryItem(variant, pluginId, username);
        const remoteByPath = new Map(item.files.map((f) => [f.target, f.content]));

        const cwd = process.cwd();
        const written: string[] = [];
        const skipped: string[] = [];
        const deleted: string[] = [];

        for (const file of files) {
          const targetPath = join(cwd, file.path);

          switch (file.action) {
            case 'write': {
              if (file.content === undefined) {
                return errorContent(`File "${file.path}" has action "write" but no content provided.`);
              }

              await fs.ensureDir(dirname(targetPath));
              await fs.writeFile(targetPath, file.content);
              written.push(file.path);
              break;
            }
            case 'skip': {
              skipped.push(file.path);
              break;
            }
            case 'delete': {
              if (await fs.pathExists(targetPath)) {
                await fs.remove(targetPath);
              }

              deleted.push(file.path);
              break;
            }
          }

          // Update base for write and skip (so conflicts don't resurface).
          // Do NOT update base for delete (preserves deleted_locally status).
          if (file.action !== 'delete') {
            const remoteContent = remoteByPath.get(file.path);

            if (remoteContent !== undefined) {
              await saveBaseVersions(pluginId, [
                { path: '', content: remoteContent, type: '', target: file.path },
              ]);
            }
          }
        }

        // Install dependencies
        if (installDependencies !== false && item.dependencies && Object.keys(item.dependencies).length > 0) {
          const deps = Object.entries(item.dependencies)
            .map(([name, version]) => `${name}@${version}`)
            .join(' ');

          await execaCommand(`pnpm add ${deps}`, { stdio: 'pipe' });
        }

        return textContent(
          JSON.stringify(
            {
              success: true,
              pluginId,
              variant,
              written,
              skipped,
              deleted,
              dependenciesInstalled:
                installDependencies !== false &&
                !!item.dependencies &&
                Object.keys(item.dependencies).length > 0,
              note: 'Base versions updated. Run makerkit_check_update again to verify all files show as unchanged.',
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
      return await withProjectDir(projectPath, async () => {
        const { variant } = await validateProject();

        // 0. Check for uncommitted changes
        const gitClean = await isGitClean();

        if (!gitClean) {
          return errorContent(
            'Git working directory has uncommitted changes. Please commit or stash them before pulling upstream updates.',
          );
        }

        // 1. Ensure upstream remote is configured
        let currentUrl = await getUpstreamRemoteUrl();

        if (!currentUrl) {
          const useSsh = await hasSshAccess();
          const url = getUpstreamUrl(variant, useSsh);

          await setUpstreamRemote(url);
          currentUrl = url;
        } else if (!isUpstreamUrlValid(currentUrl, variant)) {
          const useSsh = currentUrl.startsWith('git@');
          const expectedUrl = getUpstreamUrl(variant, useSsh);

          return errorContent(
            `Upstream remote points to "${currentUrl}" but expected "${expectedUrl}" for variant "${variant}". ` +
              'Please ask the user whether to update the upstream URL, then run: git remote set-url upstream <correct-url>',
          );
        }

        // 2. Fetch upstream
        await execaCommand('git fetch upstream');

        // 3. Attempt merge
        try {
          const { stdout } = await execaCommand(
            'git merge upstream/main --no-edit',
          );

          const alreadyUpToDate = stdout.includes('Already up to date');

          return textContent(
            JSON.stringify(
              {
                success: true,
                variant,
                upstreamUrl: currentUrl,
                alreadyUpToDate,
                message: alreadyUpToDate
                  ? 'Already up to date.'
                  : 'Successfully merged upstream changes.',
              },
              null,
              2,
            ),
          );
        } catch (mergeError) {
          // 4. Check if it's a merge conflict
          const output = getErrorOutput(mergeError);
          const isConflict =
            output.includes('CONFLICT') ||
            output.includes('Automatic merge failed');

          if (!isConflict) {
            return errorContent(`Merge failed: ${output}`);
          }

          // 5. Collect conflict details
          const { stdout: statusOutput } = await execaCommand(
            'git diff --name-only --diff-filter=U',
          );

          const conflictPaths = statusOutput
            .trim()
            .split('\n')
            .filter(Boolean);

          const cwd = process.cwd();

          const conflicts = await Promise.all(
            conflictPaths.map(async (filePath) => {
              // Read the working tree version (with conflict markers)
              let conflicted: string | undefined;

              try {
                conflicted = await fs.readFile(
                  join(cwd, filePath),
                  'utf-8',
                );
              } catch {
                conflicted = undefined;
              }

              // Read base (stage 1), ours (stage 2), theirs (stage 3)
              let base: string | undefined;
              let ours: string | undefined;
              let theirs: string | undefined;

              try {
                const { stdout: b } = await execa('git', [
                  'show',
                  `:1:${filePath}`,
                ]);
                base = b;
              } catch {
                base = undefined;
              }

              try {
                const { stdout: o } = await execa('git', [
                  'show',
                  `:2:${filePath}`,
                ]);
                ours = o;
              } catch {
                ours = undefined;
              }

              try {
                const { stdout: t } = await execa('git', [
                  'show',
                  `:3:${filePath}`,
                ]);
                theirs = t;
              } catch {
                theirs = undefined;
              }

              return { path: filePath, conflicted, base, ours, theirs };
            }),
          );

          return textContent(
            JSON.stringify(
              {
                success: false,
                variant,
                upstreamUrl: currentUrl,
                hasConflicts: true,
                conflictCount: conflicts.length,
                conflicts,
                instructions:
                  'Merge conflicts detected. For each conflict: review base, ours (local), and theirs (upstream) versions. ' +
                  'Produce resolved content and call makerkit_project_resolve_conflicts. ' +
                  'Ask the user for guidance when the intent behind local changes is unclear.',
              },
              null,
              2,
            ),
          );
        }
      });
    } catch (error) {
      return errorContent(
        error instanceof Error ? error.message : 'Unknown error',
      );
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
      return await withProjectDir(projectPath, async () => {
        const cwd = process.cwd();

        // 1. Write resolved content
        for (const file of files) {
          const targetPath = join(cwd, file.path);

          await fs.ensureDir(dirname(targetPath));
          await fs.writeFile(targetPath, file.content);
        }

        // 2. Stage resolved files
        const paths = files.map((f) => f.path);

        await execa('git', ['add', ...paths]);

        // 3. Check if there are remaining conflicts
        let remainingConflicts: string[] = [];

        try {
          const { stdout } = await execaCommand(
            'git diff --name-only --diff-filter=U',
          );

          remainingConflicts = stdout.trim().split('\n').filter(Boolean);
        } catch {
          remainingConflicts = [];
        }

        if (remainingConflicts.length > 0) {
          return textContent(
            JSON.stringify(
              {
                success: false,
                resolved: paths,
                remaining: remainingConflicts,
                message: `${paths.length} file(s) resolved, but ${remainingConflicts.length} conflict(s) remain. Resolve the remaining files and call makerkit_project_resolve_conflicts again.`,
              },
              null,
              2,
            ),
          );
        }

        // 4. Complete merge commit
        if (commitMessage) {
          await execa('git', ['commit', '-m', commitMessage]);
        } else {
          await execaCommand('git commit --no-edit');
        }

        return textContent(
          JSON.stringify(
            {
              success: true,
              resolved: paths,
              message: 'All conflicts resolved and merge commit created.',
            },
            null,
            2,
          ),
        );
      });
    } catch (error) {
      return errorContent(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();

  await server.connect(transport);
}

void main();
