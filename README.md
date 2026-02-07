# A CLI for the Makerkit SaaS Starter Kits

The CLI is a set of commands that help you manage your Makerkit SaaS Starter Kits.

The CLI is currently in beta.

NB: the CLI uses SSH to connect to GitHub. If you are not using SSH on your local machine, it will not work. In that case, please use the manual git commands instead.

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
  plugins                     List and install plugins.
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

## Plugins

The CLI can help you manage plugins in your project. You can list the available plugins, install them, and update them.

### Listing plugins

To list the available plugins, you can use the `plugins list` command:

```
> npx @makerkit/cli@latest plugins list

Available plugins:
  - cookie-banner
```

### Installing plugins

To install a plugin, you can use the `plugins install` command:

```
> npx @makerkit/cli@latest plugins install
```

This command will prompt you to select a plugin to install. Once selected, the plugin will be installed in your project.