import { join } from 'path';

import {
  PluginSignatures,
  PluginsModel,
  type PluginSignature,
} from '@/src/plugins-model';
import { addPluginToManifest, readManifest } from '@/src/utils/manifest';
import { detectVariant } from '@/src/utils/workspace';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import ora from 'ora';

interface ScanResult {
  pluginId: string;
  pluginName: string;
  confidence: 'high' | 'medium' | 'low';
  matches: string[];
}

export function createScanCommand(parentCommand: Command) {
  return parentCommand
    .command('scan')
    .description(
      'Detect legacy plugins installed via git subtree and generate a manifest.',
    )
    .action(async () => {
      try {
        const variant = await detectVariant();
        const cwd = process.cwd();

        const spinner = ora('Scanning for installed plugins...').start();

        const results: ScanResult[] = [];

        for (const signature of PluginSignatures) {
          const result = await scanForPlugin(signature, cwd);

          if (result) {
            results.push(result);
          }
        }

        spinner.stop();

        if (results.length === 0) {
          console.log(chalk.yellow('No legacy plugins detected.\n'));
          return;
        }

        console.log(
          chalk.green(`Found ${results.length} plugin(s):\n`),
        );

        for (const result of results) {
          const confidenceColor =
            result.confidence === 'high'
              ? chalk.green
              : result.confidence === 'medium'
                ? chalk.yellow
                : chalk.red;

          console.log(
            `  ${chalk.cyan(result.pluginName)} ${chalk.gray(`(${result.pluginId})`)} — confidence: ${confidenceColor(result.confidence)}`,
          );

          for (const match of result.matches) {
            console.log(`    ${chalk.gray(`- ${match}`)}`);
          }

          console.log('');
        }

        // Generate manifest
        const manifest = await readManifest();
        const existingIds = new Set(manifest.plugins.map((p) => p.pluginId));

        let added = 0;

        for (const result of results) {
          if (!existingIds.has(result.pluginId)) {
            await addPluginToManifest(
              result.pluginId,
              'unknown',
              variant,
              'legacy-scan',
            );

            added++;
          }
        }

        if (added > 0) {
          console.log(
            chalk.green(
              `Added ${added} plugin(s) to .makerkit-plugins.json with source: "legacy-scan".\n`,
            ),
          );
        } else {
          console.log(
            chalk.gray(
              'All detected plugins are already in the manifest.\n',
            ),
          );
        }

        console.log(
          `Run ${chalk.cyan('makerkit plugins init')} to set up the registry, then re-install plugins via ${chalk.cyan('makerkit plugins add <plugin-id>')}.`,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';

        console.error(chalk.red(`Error: ${message}`));
        process.exit(1);
      }
    });
}

async function scanForPlugin(
  signature: PluginSignature,
  cwd: string,
): Promise<ScanResult | null> {
  const matches: string[] = [];

  // Check directories
  for (const dir of signature.directories) {
    if (await fs.pathExists(join(cwd, dir))) {
      matches.push(`Directory exists: ${dir}`);
    }
  }

  // Check key files
  for (const file of signature.keyFiles) {
    if (await fs.pathExists(join(cwd, file))) {
      matches.push(`Key file found: ${file}`);
    }
  }

  // Check npm dependencies in root package.json
  const rootPkgPath = join(cwd, 'package.json');

  if (await fs.pathExists(rootPkgPath)) {
    const rootPkg = await fs.readJson(rootPkgPath);
    const allDeps = {
      ...rootPkg.dependencies,
      ...rootPkg.devDependencies,
    };

    for (const dep of signature.npmDependencies) {
      if (allDeps[dep]) {
        matches.push(`npm dependency: ${dep}`);
      }
    }
  }

  // Check env var prefixes in .env files
  for (const envFile of ['.env.local', '.env.example']) {
    const envPath = join(cwd, envFile);

    if (await fs.pathExists(envPath)) {
      const content = await fs.readFile(envPath, 'utf-8');

      for (const prefix of signature.envVarPrefixes) {
        if (content.includes(prefix)) {
          matches.push(`Env var prefix in ${envFile}: ${prefix}`);
        }
      }
    }
  }

  if (matches.length === 0) {
    return null;
  }

  const confidence: ScanResult['confidence'] =
    matches.length >= 3 ? 'high' : matches.length >= 2 ? 'medium' : 'low';

  const plugin = PluginsModel[signature.pluginId];

  return {
    pluginId: signature.pluginId,
    pluginName: plugin?.name ?? signature.pluginId,
    confidence,
    matches,
  };
}
