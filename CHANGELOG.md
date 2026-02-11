# Changelog

All notable changes to this project will be documented in this file.

## 2.0.1 - 2026-02-11

- Fix `pnpm dlx @makerkit/cli` failing with `ERR_PNPM_DLX_MULTIPLE_BINS` by adding a default `cli` bin entry matching the unscoped package name

## 2.0.0 - 2026-02-08

Complete rewrite of the plugin system. Replaced git subtree distribution with a registry-based architecture using shadcn's JSON format and AST-powered codemods. Added a new `project update` command and MCP tools for pulling upstream kit updates with AI-assisted conflict resolution.

### New `project update` command
- `project update` - Pull latest changes from the upstream MakerKit repository
- Auto-detects kit variant and maps to the correct upstream repo
- Detects SSH access to GitHub; falls back to HTTPS URLs when SSH is unavailable
- Configures `upstream` git remote automatically (with user confirmation)
- Warns when the existing upstream remote points to the wrong repository
- Reports merge conflicts with step-by-step resolution instructions

### New plugin commands
- `plugins add [id...]` - Install one or more plugins (interactive multi-select when no arguments given)
- `plugins update [id...]` - Update installed plugins with confirmation before overwriting modified files
- `plugins outdated` - Check which installed plugins have newer versions available
- `plugins diff [id]` - Show a colored unified diff between local files and the latest registry version
- `plugins init` - Configure GitHub username for registry access
- `plugins list` - List available and installed plugins with filesystem-based detection

### MCP tools
- `makerkit_status` - Project introspection: variant, git status, registry config, installed plugins
- `makerkit_list_plugins` - List available plugins with install status and metadata
- `makerkit_add_plugin` - Install a plugin (codemod, env vars, base version storage)
- `makerkit_init_registry` - Cache GitHub username for registry auth
- `makerkit_check_update` - Three-way diff analysis (base/local/remote) with per-file status and content
- `makerkit_apply_update` - Write AI-resolved files to disk and update base versions
- `makerkit_project_pull` - Pull upstream kit updates with AI-assisted conflict resolution; returns base/ours/theirs content for each conflicting file
- `makerkit_project_resolve_conflicts` - Write AI-resolved files, stage them, and complete the merge commit

### Architecture changes
- Built custom file download orchestrator (shadcn CLI doesn't support nested file paths)
- Plugin catalog fetched from remote registry with 1-hour local cache and bundled fallback
- Variant auto-detection from `package.json` dependencies (Next.js Supabase, Drizzle, Prisma, React Router)
- Filesystem-based installation detection (no manifest file needed)
- Clean git state enforcement with `git checkout . && git clean -fd` rollback
- Registry authentication via GitHub organization membership
- SSH/HTTPS detection is now automatic across CLI and MCP tools

### Other changes
- Added Next.js Drizzle and Prisma kits to `new` command
- Removed deprecated commands: `blog`, `i18n`, `license`
- Removed legacy git subtree install/update/service commands

## 1.3.14 - 2025-10-01
- Added Signoz plugin
- Added Paddle plugin

## 1.3.11 - 2024-08-16
- Added analytics plugins to the Remix Supabase kit

## 1.3.10 - 2024-07-30

- Added `kanban` and `roadmap` plugins to Next.js Supabase kit model

## 1.3.9 - 2024-07-30

- Added `kanban` plugin to Next.js Supabase kit
- Added `roadmap` plugin to Next.js Supabase kit

## 1.3.8 - 2024-07-23

- Fix Workspace detection

## 1.3.7 - 2024-07-23

- Added Analytics Plugins to Next.js Supabase kit

## 1.3.5 - 2024-07-14

- Added Testimonial Plugin to Remix Supabase kit

## 1.3.4 - 2024-07-14

- Added Testimonial Plugin to Next.js Supabase kit

## 1.3.3 - 2024-06-23

- Updated IDs of the turbo plugins

## 1.3.2 - 2024-06-22

- Added more plugins to the Next.js Supabase kit

## 1.3.1 - 2024-06-18

- Only list plugins compatible with the current kit

## 1.3.0 - 2024-06-16

- Added `waitlist` plugin and introduced Turbo repositories

## 1.2.10 - 2023-10-29

- Added AI Text Editor plugin to Supabase kits

## 1.2.9 - 2023-10-17

- Added AI Chatbot plugin to Next.js Firebase kit

## 1.2.8 - 2023-10-16

- Republish 1.2.7

## 1.2.7 - 2023-10-16

- Added Feedback plugin to Next.js Firebase kit

## 1.2.6 - 2023-10-12

- Added plugins to Remix Supabase kit
- 
## 1.2.5 - 2023-10-11

- Added feedback plugin

## 1.2.4 - 2023-10-11

- Fix kit detection

## 1.2.3 - 2023-09-21

- Rebuild release dist

## 1.2.2 - 2023-09-21

- Fix version detection for Supabase kits

## 1.2.1 - 2023-09-21

- Added `chatbot` plugin to add a chatbot to the Next.js Supabase Kit.

## 1.2.0 - 2023-08-25

- Added `blog generate` command to generate blog posts using OpenAI.

## 1.1.1 - 2023-08-25

- Added `license` command to activate a Makerkit license using the CLI.

## 1.1.0 - 2023-08-24

- Added `new` command to create a new project from a starter kit.
- Minor refactoring.

## 1.0.0 - 2023-08-24

- Initial release. Added `plugins` and `i18n` commands.