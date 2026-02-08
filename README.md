# A CLI for the Makerkit SaaS Starter Kits

The CLI is a set of commands that help you manage your Makerkit SaaS Starter Kits.

The CLI is currently in beta.

The CLI auto-detects whether you have SSH access to GitHub. If SSH is not available, it falls back to HTTPS URLs automatically.

## Installation

You can run commands using `npx`:

```
npx @makerkit/cli@latest <command>
```

If you use PNPM, use:

```
pnpm dlx @makerkit/cli@latest <command>
```

This ensures that you always run the latest version of the CLI.

### Some commands require a Makerkit repository

Commands that interact with the repository (plugins, i18n) must be 
launched from the root of the repository, as they will read and write files 
from the codebase.

## Usage

Running the CLI without any arguments will display the help:

```
Usage: makerkit [options] [command]

Your SaaS Kit companion. Add plugins, manage migrations, and more.

Options:
  display the version number  output the version number
  -h, --help                  display help for command

Commands:
  new                         Initialize a new Makerkit project
  plugins                     Manage MakerKit plugins.
  project                     Manage your MakerKit project.
  help [command]              display help for command
```

## Creating a new Makerkit project

To create a new Makerkit project, you can use the `new` command:

```
> npx @makerkit/cli@latest new
```

The CLI will prompt you to select a starter kit to use and a name. Once 
selected, the CLI will create a new project in the current directory by 
pulling the starter kit from GitHub.

The command will also install the dependencies.

## Project

The `project` command group helps you manage your MakerKit project.

### Pulling upstream updates

```
makerkit project update
```

This command pulls the latest changes from the official MakerKit repository into your project. It:

1. Detects which kit variant you're using (Next.js Supabase, Next.js Drizzle, etc.)
2. Checks for SSH access to GitHub and falls back to HTTPS if unavailable
3. Configures the `upstream` git remote if it doesn't exist (prompts for confirmation)
4. Warns if the existing `upstream` remote points to the wrong repository
5. Runs `git fetch upstream` followed by `git merge upstream/main`
6. Reports success, already-up-to-date, or merge conflicts with resolution instructions

| Variant | Upstream Repository |
|---------|-------------------|
| Next.js Supabase | `makerkit/next-supabase-saas-kit-turbo` |
| Next.js Drizzle | `makerkit/next-drizzle-saas-kit-turbo` |
| Next.js Prisma | `makerkit/next-prisma-saas-kit-turbo` |
| React Router Supabase | `makerkit/react-router-supabase-saas-kit-turbo` |

## Plugins

The CLI can help you manage plugins in your project. You can list, install, update, and diff plugins.

| Command | Description |
|---------|-------------|
| `plugins list` | List available and installed plugins |
| `plugins add [id...]` | Install one or more plugins |
| `plugins update [id...]` | Update installed plugins to the latest version |
| `plugins outdated` | Check which installed plugins have updates |
| `plugins diff [id]` | Show a git-style diff against the latest version |
| `plugins init` | Set up your GitHub username for registry access |

### Listing plugins

```
makerkit plugins list
```

### Installing plugins

```
makerkit plugins add feedback
```

Install multiple at once:

```
makerkit plugins add umami posthog feedback
```

Running `plugins add` with no arguments shows a multi-select list of available plugins.

### Updating plugins

```
makerkit plugins update
```

Or specify plugin IDs directly:

```
makerkit plugins update umami feedback
```

If your local files differ from the registry, the command lists the modified files and asks for confirmation before overwriting.

### Checking for updates

```
makerkit plugins outdated
```

### Diffing plugins

```
makerkit plugins diff umami
```

Running `plugins diff` with no arguments prompts you to select an installed plugin. Shows a colored unified diff (via `git diff`) between your local files and the latest registry version.

## MCP Server

The CLI ships an MCP server (`makerkit-cli-mcp`) that exposes plugin management and project operations as tools for AI agents. This enables AI-powered workflows such as installing plugins, checking for updates, **three-way merge conflict resolution** when updating plugins with local customizations, and **pulling upstream kit updates with AI-assisted conflict resolution**.

> **Warning:** AI conflict merging is non-deterministic. Merged output can contain mistakes — always review the result and run your test suite before committing.

### Available tools

| Tool | Description |
|------|-------------|
| `makerkit_status` | Project introspection: variant, git status, registry config, installed plugins |
| `makerkit_list_plugins` | List available plugins with install status and metadata |
| `makerkit_add_plugin` | Install a plugin (codemod, env vars, base version storage) |
| `makerkit_init_registry` | Cache your GitHub username for registry auth |
| `makerkit_check_update` | Three-way diff analysis (base/local/remote) with per-file status and content |
| `makerkit_apply_update` | Write AI-resolved files to disk and update base versions |
| `makerkit_project_pull` | Pull upstream kit updates, returning conflict details (base/ours/theirs) for AI resolution |
| `makerkit_project_resolve_conflicts` | Write AI-resolved conflict files, stage them, and complete the merge commit |

### Installation

Install the package globally (or use `npx`/`pnpm dlx`):

```
npm i -g @makerkit/cli@latest
```

Then configure your AI client to use the MCP server.

**Claude Desktop** (`~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "makerkit-cli": {
      "command": "makerkit-cli-mcp"
    }
  }
}
```

**Cursor** (`.cursor/mcp.json` in your project root):

```json
{
  "mcpServers": {
    "makerkit-cli": {
      "command": "makerkit-cli-mcp"
    }
  }
}
```

If you haven't installed the package globally, use `npx` instead:

```json
{
  "mcpServers": {
    "makerkit-cli": {
      "command": "npx",
      "args": ["-y", "@makerkit/cli@latest", "makerkit-cli-mcp"]
    }
  }
}
```

### Three-way merge workflow

When a plugin is installed or updated, the CLI stores the original registry files as **base versions** in `.makerkit/bases/`. On the next update, the `makerkit_check_update` tool computes a three-way diff (base vs. local vs. remote) for each file and returns one of these statuses:

| Status | Meaning |
|--------|---------|
| `unchanged` | Local matches remote — nothing to do |
| `updated` | Only the registry changed — safe to auto-apply |
| `conflict` | Both sides changed — AI merge needed |
| `no_base` | Legacy install (no stored base) — two-way diff |
| `added` | New file from registry |
| `deleted_locally` | You deleted the file, but registry still ships it |

The AI agent reads the base, local, and remote content for `conflict` files, produces a merged version, then calls `makerkit_apply_update` to write the resolved files.

Base versions are stored in `node_modules/.cache/makerkit/bases/` — already gitignored by default. They get cleared on `npm ci` or deleting `node_modules/`, in which case plugins fall back to two-way diff (`no_base`) until the next apply restores them.

### Upstream pull workflow

The `makerkit_project_pull` and `makerkit_project_resolve_conflicts` tools automate pulling updates from the official MakerKit repository with AI-assisted conflict resolution.

**How it works:**

1. The agent calls `makerkit_project_pull` with the project path
2. The tool detects the kit variant, configures the `upstream` remote (SSH or HTTPS), fetches, and attempts a merge
3. If the merge succeeds, it returns a success response
4. If merge conflicts occur, it returns the **base**, **ours** (local), and **theirs** (upstream) content for each conflicting file
5. The agent reviews the three versions, produces resolved content, and asks the user for guidance when the intent behind local changes is unclear
6. The agent calls `makerkit_project_resolve_conflicts` with the resolved files to write them, stage them, and complete the merge commit
7. If some conflicts remain unresolved, the tool reports them so the agent can resolve them in another round
