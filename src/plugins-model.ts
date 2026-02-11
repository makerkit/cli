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
  path?: string;
}

export interface PluginDefinition {
  name: string;
  id: string;
  description: string;
  variants: Partial<Record<Variant, VariantConfig>>;
  postInstallMessage?: string;
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
    id: 'directus-cms',
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
  }
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

    return !!pkg.name && !!pkg.exports;
  } catch {
    return false;
  }
}
