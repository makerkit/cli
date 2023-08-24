# A CLI for the Makerkit SaaS Starter Kits

The CLI is a set of commands that help you manage your Makerkit SaaS Starter Kits.

## Installation

To install the CLI, you can use npm:

```
npm install -g makerkit/cli
```

Alternatively, your can run commands using `npx`:

```
npx makerkit/cli <command>
```

## Usage

Running the CLI without any arguments will display the help:

```
> makerkit-cli

Options:
  display the version number  output the version number
  -h, --help                  display help for command

Commands:
  plugins                     List and install plugins.
  i18n                        Manage and translate your i18n files
  help [command]              display help for command
```

## Plugins

The CLI can help you manage plugins in your project. You can list the available plugins, install them, and update them.

### Listing plugins

To list the available plugins, you can use the `plugins list` command:

```
> makerkit-cli plugins list

Available plugins:
  - cookie-banner
```

### Installing plugins

To install a plugin, you can use the `plugins install` command:

```
> makerkit-cli plugins install
```

This command will prompt you to select a plugin to install. Once selected, the plugin will be installed in your project.

### Updating plugins

To update a plugin, you can use the `plugins update` command:

```
> makerkit-cli plugins update
```

This command will prompt you to select a plugin to update. Once selected, the plugin will be updated in your project.

## i18n

The CLI can help you manage your i18n files. You can translate from a locale 
to another (requires an OpenAI key), and verify that your translations are 
in sync between each other.

### Translating

To translate your i18n files, you can use the `i18n translate` command:

```
> makerkit-cli i18n translate en es
```

This command will translate all the keys in your `en/*.json` file to `es/*.
json`. It will use the OpenAI API to translate the keys. You will need to 
add a valid OpenAI API key in the `.env.local` file of your Makerkit repository.

### Verifying

To verify that your i18n files are in sync, you can use the `i18n verify` command:

```
> makerkit-cli i18n verify <base-locale>
```

If you omit the `base-locale` argument, the command will use `en` as the base.
