# A CLI for the Makerkit SaaS Starter Kits

The CLI is a set of commands that help you manage your Makerkit SaaS Starter Kits.

The CLI is currently in beta.

NB: the CLI uses SSH to connect to GitHub. If you are not using SSH on your local machine, it will not work. In that case, please use the manual git commands instead.

## Installation

You can run commands using `npx`:

```
npx @makerkit/cli@latest <command>
```

This ensures that you always run the latest version of the CLI.

### Some commands require a Makerkit repository

Commands that interact with the repository (plugins, i18n, blog) must be 
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
  i18n                        Manage and translate your i18n files
  license                     Manage Licenses
  blog                        Manage and generate your blog posts
  help [command]              display help for command
```

### Adding an OpenAI Key (optional)

To use the generative AI features of the CLI, you will need to add an OpenAI 
key. 

To do so, create a `.env.local` file if it does not exist yet, and add the
following environment variable:

```
OPENAI_API_KEY=<your-key>
```

This key will be used to generate the prompts for your blog posts. It
remains locally on your computer and is not shared with anyone.

At the moment of writing, the CLI only uses the OpenAI API to generate:
1. Translations for your i18n files
2. Blog Posts

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

### Updating plugins

To update a plugin, you can use the `plugins update` command:

```
> npx @makerkit/cli@latest plugins update
```

This command will prompt you to select a plugin to update. Once selected, the plugin will be updated in your project.

## i18n

The CLI can help you manage your i18n files. You can translate from a locale 
to another (requires an OpenAI key), and verify that your translations are 
in sync between each other.

### Translating

To translate your i18n files, you can use the `i18n translate` command:

```
> npx @makerkit/cli@latest i18n translate en es
```

This command will translate all the keys in your `en/*.json` file to `es/*.
json`. It will use the OpenAI API to translate the keys. You will need to 
add a valid OpenAI API key in the `.env.local` file of your Makerkit repository.

### Verifying

To verify that your i18n files are in sync, you can use the `i18n verify` command:

```
> npx @makerkit/cli@latest i18n verify <base-locale>
```

If you omit the `base-locale` argument, the command will use `en` as the base.

## Blog

The CLI can help you generate your blog posts. 

NB: this command requires you to setup an OpenAI key.

### Generating a new blog post

To generate a new blog post, you can use the `blog generate` command:

```
> npx @makerkit/cli@latest blog generate
```

You will be prompted to enter the following information:
1. **Title**: The title of the blog post
2. **Category**: The category of the blog post. At this time, this file 
   needs to exist in 
   your Makerkit repository. You can create it later.
3. **Word Count**: The target word count of the blog post.
4. **Prompt**: Any additional information you want to add to the prompt 
   (optional).

## Licenses

The CLI can help you manage your licenses.

### Activating your Makerkit License

To activate your Makerkit license, you can use the `license activate` command:

```
> npx @makerkit/cli@latest license activate
```

This command will prompt you to enter your license key and your Github username. Once entered, the command will activate your license.
