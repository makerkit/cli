import { join } from 'path';

import fs from 'fs-extra';
import invariant from 'tiny-invariant';

import { fetchPluginRegistry } from '@/src/utils/plugins-cache';
import type { Variant } from '@/src/utils/workspace';

export interface EnvVar {
  key: string;
  description: string;
  defaultValue?: string;
}

export interface VariantConfig {
  envVars: EnvVar[];
  /**
   * The plugin's own package, used to detect whether it is installed. Must be
   * a library package — a directory with a `package.json` declaring both
   * `name` and `exports`.
   */
  path?: string;
  /**
   * Every directory the plugin owns, when it spans more than `path`. Apps and
   * route trees belong here: they are part of the plugin but are not library
   * packages, so they cannot serve as `path`.
   *
   * All of them have to be present for the plugin to count as installed, so a
   * partially removed plugin can be reinstalled rather than being mistaken for
   * a complete one.
   */
  paths?: string[];
}

export interface PluginDefinition {
  name: string;
  id: string;
  description: string;
  variants: Partial<Record<Variant, VariantConfig>>;
  postInstallMessage?: string;
  /**
   * The plugin brings its own files rather than receiving them from the file
   * registry, so installing it is the codemod alone.
   *
   * The registry stores each file's content as a string, which rules it out
   * for anything shipping binary assets, and it is a poor fit for a plugin the
   * size of a whole second app. Such a plugin fetches its own sources, and the
   * CLI skips both the registry download and the base-version snapshot that
   * the update machinery is built on — see `isTrackable`.
   */
  selfDistributing?: boolean;
}

const DEFAULT_PLUGINS: Record<string, PluginDefinition> = {
  feedback: {
    name: 'Feedback',
    id: 'feedback',
    description: 'Add a feedback popup to your site.',
    postInstallMessage: 'Run database migrations: pnpm db:migrate',
    variants: {
      'next-supabase': {
        envVars: [],
        path: 'packages/plugins/feedback',
      },
    },
  },
  waitlist: {
    name: 'Waitlist',
    id: 'waitlist',
    description: 'Add a waitlist to your site.',
    postInstallMessage: 'Run database migrations: pnpm db:migrate',
    variants: {
      'next-supabase': {
        envVars: [],
        path: 'packages/plugins/waitlist',
      },
    },
  },
  testimonial: {
    name: 'Testimonial',
    id: 'testimonial',
    description: 'Add a testimonial widget to your site.',
    postInstallMessage: 'Run database migrations: pnpm db:migrate',
    variants: {
      'next-supabase': {
        envVars: [],
        path: 'packages/plugins/testimonial',
      },
    },
  },
  roadmap: {
    name: 'Roadmap',
    id: 'roadmap',
    description: 'Add a roadmap to your site.',
    postInstallMessage: 'Run database migrations: pnpm db:migrate',
    variants: {
      'next-supabase': {
        envVars: [],
        path: 'packages/plugins/roadmap',
      },
    },
  },
  'google-analytics': {
    name: 'Google Analytics',
    id: 'google-analytics',
    description: 'Add Google Analytics to your site.',
    variants: {
      'next-supabase': {
        envVars: [
          {
            key: 'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID',
            description: 'Google Analytics Measurement ID',
          },
        ],
        path: 'packages/plugins/analytics/google-analytics',
      },
      'next-drizzle': {
        envVars: [
          {
            key: 'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID',
            description: 'Google Analytics Measurement ID',
          },
        ],
        path: 'packages/plugins/analytics/google-analytics',
      },
      'next-prisma': {
        envVars: [
          {
            key: 'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID',
            description: 'Google Analytics Measurement ID',
          },
        ],
        path: 'packages/plugins/analytics/google-analytics',
      }
    },
  },
  honeybadger: {
    name: 'Honeybadger',
    id: 'honeybadger',
    description: 'Add Honeybadger Error Tracking to your site.',
    variants: {
      'next-supabase': {
        envVars: [
          {
            key: 'HONEYBADGER_API_KEY',
            description: 'Honeybadger private API key',
          },
          {
            key: 'NEXT_PUBLIC_HONEYBADGER_ENVIRONMENT',
            description: 'Honeybadger environment',
          },
          {
            key: 'NEXT_PUBLIC_HONEYBADGER_REVISION',
            description: 'Honeybadger log revision',
          }
        ],
        path: 'packages/plugins/honeybadger',
      },
      'next-drizzle': {
        envVars: [
          {
            key: 'HONEYBADGER_API_KEY',
            description: 'Honeybadger private API key',
          },
          {
            key: 'NEXT_PUBLIC_HONEYBADGER_ENVIRONMENT',
            description: 'Honeybadger environment',
          },
          {
            key: 'NEXT_PUBLIC_HONEYBADGER_REVISION',
            description: 'Honeybadger log revision',
          }
        ],
        path: 'packages/plugins/honeybadger',
      },
      'next-prisma': {
        envVars: [
          {
            key: 'HONEYBADGER_API_KEY',
            description: 'Honeybadger private API key',
          },
          {
            key: 'NEXT_PUBLIC_HONEYBADGER_ENVIRONMENT',
            description: 'Honeybadger environment',
          },
          {
            key: 'NEXT_PUBLIC_HONEYBADGER_REVISION',
            description: 'Honeybadger log revision',
          }
        ],
      },
    }
  },
  posthog: {
    name: 'PostHog',
    id: 'posthog',
    description: 'Add PostHog Analytics to your site.',
    variants: {
      'next-supabase': {
        envVars: [
          {
            key: 'NEXT_PUBLIC_POSTHOG_KEY',
            description: 'PostHog project API key',
          },
          {
            key: 'NEXT_PUBLIC_POSTHOG_HOST',
            description: 'PostHog host URL',
            defaultValue: 'https://app.posthog.com',
          },
        ],
        path: 'packages/plugins/analytics/posthog',
      },
      'next-drizzle': {
        envVars: [
          {
            key: 'NEXT_PUBLIC_POSTHOG_KEY',
            description: 'PostHog project API key',
          },
          {
            key: 'NEXT_PUBLIC_POSTHOG_HOST',
            description: 'PostHog host URL',
            defaultValue: 'https://app.posthog.com',
          },
        ],
        path: 'packages/plugins/analytics/posthog',
      },
      'next-prisma': {
        envVars: [
          {
            key: 'NEXT_PUBLIC_POSTHOG_KEY',
            description: 'PostHog project API key',
          },
          {
            key: 'NEXT_PUBLIC_POSTHOG_HOST',
            description: 'PostHog host URL',
            defaultValue: 'https://app.posthog.com',
          },
        ],
        path: 'packages/plugins/analytics/posthog',
      },
    },
  },
  umami: {
    name: 'Umami',
    id: 'umami',
    description: 'Add Umami Analytics to your site.',
    variants: {
      'next-supabase': {
        envVars: [
          {
            key: 'NEXT_PUBLIC_UMAMI_WEBSITE_ID',
            description: 'Umami website ID',
          },
          {
            key: 'NEXT_PUBLIC_UMAMI_HOST',
            description: 'Umami host URL',
          },
        ],
        path: 'packages/plugins/analytics/umami',
      },
      'next-drizzle': {
        envVars: [
          {
            key: 'NEXT_PUBLIC_UMAMI_WEBSITE_ID',
            description: 'Umami website ID',
          },
          {
            key: 'NEXT_PUBLIC_UMAMI_HOST',
            description: 'Umami host URL',
          },
        ],
        path: 'packages/plugins/analytics/umami',
      },
      'next-prisma': {
        envVars: [
          {
            key: 'NEXT_PUBLIC_UMAMI_WEBSITE_ID',
            description: 'Umami website ID',
          },
          {
            key: 'NEXT_PUBLIC_UMAMI_HOST',
            description: 'Umami host URL',
          },
        ],
        path: 'packages/plugins/analytics/umami',
      },
    },
  },
  signoz: {
    name: 'SigNoz',
    id: 'signoz',
    description: 'Add SigNoz Monitoring to your app.',
    variants: {
      'next-supabase': {
        envVars: [
          {
            key: 'OTEL_EXPORTER_OTLP_ENDPOINT',
            description: 'SigNoz OTLP endpoint URL',
          },
        ],
        path: 'packages/plugins/signoz',
      },
      'next-drizzle': {
        envVars: [
          {
            key: 'OTEL_EXPORTER_OTLP_ENDPOINT',
            description: 'SigNoz OTLP endpoint URL',
          },
        ],
        path: 'packages/plugins/signoz',
      },
      'next-prisma': {
        envVars: [
          {
            key: 'OTEL_EXPORTER_OTLP_ENDPOINT',
            description: 'SigNoz OTLP endpoint URL',
          },
        ],
        path: 'packages/plugins/signoz',
      },
    },
  },
  paddle: {
    name: 'Paddle',
    id: 'paddle',
    description: 'Add Paddle Billing to your app.',
    variants: {
      'next-supabase': {
        envVars: [
          {
            key: 'NEXT_PUBLIC_PADDLE_CLIENT_TOKEN',
            description: 'Paddle client-side token',
          },
          {
            key: 'PADDLE_API_KEY',
            description: 'Paddle API key',
          },
          {
            key: 'PADDLE_WEBHOOK_SECRET',
            description: 'Paddle webhook secret',
          },
        ],
        path: 'packages/plugins/paddle',
      },
    },
  },
  'supabase-cms': {
    name: 'Supabase CMS',
    id: 'supabase-cms',
    description: 'Add Supabase CMS provider to your app.',
    postInstallMessage: 'Run database migrations: pnpm db:migrate',
    variants: {
      'next-supabase': {
        envVars: [],
        path: 'packages/plugins/supabase-cms',
      },
    },
  },
  'meshes-analytics': {
    name: 'Meshes Analytics',
    id: 'meshes-analytics',
    description: 'Add Meshes Analytics to your app.',
    variants: {
      'next-supabase': {
        envVars: [
          {
            key: 'NEXT_PUBLIC_MESHES_PUBLISHABLE_KEY',
            description: 'The Meshes publishable key'
          }
        ],
        path: 'packages/plugins/meshes-analytics',
      },
    },
  },
  directus: {
    name: 'Directus CMS',
    id: 'directus',
    description: 'Add Directus as your CMS.',
    variants: {
      'next-supabase': {
        envVars: [
          {
            key: 'NEXT_PUBLIC_DIRECTUS_URL',
            description: 'The Directus URL'
          },
          {
            key: 'DIRECTUS_ACCESS_TOKEN',
            description: 'The Directus access token'
          }
        ],
        path: 'packages/plugins/directus',
      },
      'next-drizzle': {
        envVars: [
          {
            key: 'NEXT_PUBLIC_DIRECTUS_URL',
            description: 'The Directus URL'
          },
          {
            key: 'DIRECTUS_ACCESS_TOKEN',
            description: 'The Directus access token'
          }
        ],
        path: 'packages/plugins/directus',
      },
      'next-prisma': {
        envVars: [
          {
            key: 'NEXT_PUBLIC_DIRECTUS_URL',
            description: 'The Directus URL'
          },
          {
            key: 'DIRECTUS_ACCESS_TOKEN',
            description: 'The Directus access token'
          }
        ],
        path: 'packages/plugins/directus',
      },
    },
  },
  expo: {
    name: 'Expo Mobile App',
    id: 'expo',
    description: 'Add an Expo mobile app that shares code with your web app.',
    // The codemod fetches apps/native, packages/mobile-ui and the /api/v1
    // routes itself — the registry cannot carry the app's binary assets.
    selfDistributing: true,
    postInstallMessage:
      'Set EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_PUBLIC_KEY and EXPO_PUBLIC_API_BASE_URL in apps/native/.env.development, then run: pnpm run start:native',
    variants: {
      'next-supabase': {
        // EXPO_PUBLIC_* vars belong in apps/native/.env.development, which
        // ships with working local defaults. Declaring them here would append
        // them to the web app's .env files instead.
        envVars: [],
        // The Expo app itself cannot be the detection path: `isInstalled`
        // needs a package.json with `name` and `exports`, and apps/native has
        // no `exports` — it is an app, not a library.
        path: 'packages/mobile-ui',
        paths: [
          'packages/mobile-ui',
          'apps/native',
          'apps/web/app/api/v1',
        ],
      },
    },
  },
};

export class PluginRegistry {
  private constructor(
    private plugins: Record<string, PluginDefinition>,
  ) {}

  static async load(): Promise<PluginRegistry> {
    const registryUrl = process.env.MAKERKIT_PLUGINS_REGISTRY_URL;
    const plugins = await fetchPluginRegistry(registryUrl, DEFAULT_PLUGINS);

    return new PluginRegistry(plugins);
  }

  getPluginById(id: string): PluginDefinition | undefined {
    return this.plugins[id];
  }

  getPluginsForVariant(variant: Variant): PluginDefinition[] {
    return Object.values(this.plugins).filter((p) => variant in p.variants);
  }

  validatePlugin(pluginId: string, variant: Variant): PluginDefinition {
    const plugin = this.getPluginById(pluginId);

    invariant(plugin, `Plugin "${pluginId}" not found`);

    invariant(
      plugin.variants[variant],
      `Plugin "${pluginId}" is not available for the ${variant} variant`,
    );

    return plugin;
  }
}

export function getEnvVars(
  plugin: PluginDefinition,
  variant: Variant,
): EnvVar[] {
  return plugin.variants[variant]?.envVars ?? [];
}

export function getPath(
  plugin: PluginDefinition,
  variant: Variant,
): string | undefined {
  return plugin.variants[variant]?.path;
}

/**
 * Every directory the plugin owns. Falls back to the single `path` for the
 * plugins that are one package, which is most of them.
 */
export function getPaths(
  plugin: PluginDefinition,
  variant: Variant,
): string[] {
  const config = plugin.variants[variant];

  if (config?.paths?.length) {
    return config.paths;
  }

  return config?.path ? [config.path] : [];
}

/**
 * Whether the plugin's files can be compared against the registry, which is
 * what every update path here is built on. Self-distributing plugins have no
 * registry entry to diff against, so they are reported as up to date rather
 * than blowing up on a 404 halfway through `makerkit plugins outdated`.
 */
export function isTrackable(plugin: PluginDefinition): boolean {
  return !plugin.selfDistributing;
}

export async function isInstalled(
  plugin: PluginDefinition,
  variant: Variant,
): Promise<boolean> {
  const pluginPath = getPath(plugin, variant);

  if (!pluginPath) {
    return false;
  }

  const pkgJsonPath = join(process.cwd(), pluginPath, 'package.json');

  if (!(await fs.pathExists(pkgJsonPath))) {
    return false;
  }

  try {
    const pkg = await fs.readJson(pkgJsonPath);

    if (!pkg.name || !pkg.exports) {
      return false;
    }
  } catch {
    return false;
  }

  // A plugin spanning several directories is only installed when all of them
  // are there. Without this, deleting the app half of a multi-directory plugin
  // would still read as installed, and `plugins add` would refuse to repair it.
  for (const ownedPath of getPaths(plugin, variant)) {
    // Already proven present by its package.json above.
    if (ownedPath === pluginPath) {
      continue;
    }

    if (!(await fs.pathExists(join(process.cwd(), ownedPath)))) {
      return false;
    }
  }

  return true;
}
