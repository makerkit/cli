import invariant from 'tiny-invariant';

export interface EnvVar {
  key: string;
  description: string;
  defaultValue?: string;
}

export interface PluginDefinition {
  name: string;
  id: string;
  description: string;
  envVars: EnvVar[];
  postInstallMessage?: string;
}

export interface PluginSignature {
  pluginId: string;
  directories: string[];
  keyFiles: string[];
  configImports: string[];
  npmDependencies: string[];
  envVarPrefixes: string[];
}

export const PluginsModel: Record<string, PluginDefinition> = {
  chatbot: {
    name: 'AI Chatbot',
    id: 'chatbot',
    description: 'Add an AI Chatbot to your site.',
    envVars: [
      {
        key: 'OPENAI_API_KEY',
        description: 'OpenAI API Key for the chatbot',
      },
    ],
    postInstallMessage: 'Run database migrations: pnpm db:migrate',
  },
  feedback: {
    name: 'Feedback',
    id: 'feedback',
    description: 'Add a feedback popup to your site.',
    envVars: [],
    postInstallMessage: 'Run database migrations: pnpm db:migrate',
  },
  waitlist: {
    name: 'Waitlist',
    id: 'waitlist',
    description: 'Add a waitlist to your site.',
    envVars: [],
    postInstallMessage: 'Run database migrations: pnpm db:migrate',
  },
  testimonial: {
    name: 'Testimonial',
    id: 'testimonial',
    description: 'Add a testimonial widget to your site.',
    envVars: [],
    postInstallMessage: 'Run database migrations: pnpm db:migrate',
  },
  roadmap: {
    name: 'Roadmap',
    id: 'roadmap',
    description: 'Add a roadmap to your site.',
    envVars: [],
    postInstallMessage: 'Run database migrations: pnpm db:migrate',
  },
  kanban: {
    name: 'Kanban',
    id: 'kanban',
    description: 'Add a Kanban board to your site.',
    envVars: [],
    postInstallMessage: 'Run database migrations: pnpm db:migrate',
  },
  'text-editor': {
    name: 'AI Text Editor',
    id: 'text-editor',
    description: 'Add an AI Text Editor to your site.',
    envVars: [
      {
        key: 'OPENAI_API_KEY',
        description: 'OpenAI API Key for the text editor',
      },
    ],
    postInstallMessage: 'Run database migrations: pnpm db:migrate',
  },
  'google-analytics': {
    name: 'Google Analytics',
    id: 'google-analytics',
    description: 'Add Google Analytics to your site.',
    envVars: [
      {
        key: 'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID',
        description: 'Google Analytics Measurement ID',
      },
    ],
  },
  posthog: {
    name: 'PostHog',
    id: 'posthog',
    description: 'Add PostHog Analytics to your site.',
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
  },
  umami: {
    name: 'Umami',
    id: 'umami',
    description: 'Add Umami Analytics to your site.',
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
  },
  signoz: {
    name: 'SigNoz',
    id: 'signoz',
    description: 'Add SigNoz Monitoring to your app.',
    envVars: [
      {
        key: 'OTEL_EXPORTER_OTLP_ENDPOINT',
        description: 'SigNoz OTLP endpoint URL',
      },
    ],
  },
  paddle: {
    name: 'Paddle',
    id: 'paddle',
    description: 'Add Paddle Billing to your app.',
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
  },
  'supabase-cms': {
    name: 'Supabase CMS',
    id: 'supabase-cms',
    description: 'Add Supabase CMS provider to your app.',
    envVars: [],
    postInstallMessage: 'Run database migrations: pnpm db:migrate',
  },
};

export const PluginSignatures: PluginSignature[] = [
  {
    pluginId: 'chatbot',
    directories: ['packages/plugins/chatbot'],
    keyFiles: ['packages/plugins/chatbot/package.json'],
    configImports: ['@kit/chatbot'],
    npmDependencies: ['@kit/chatbot'],
    envVarPrefixes: ['OPENAI_API_KEY'],
  },
  {
    pluginId: 'feedback',
    directories: ['packages/plugins/feedback'],
    keyFiles: ['packages/plugins/feedback/package.json'],
    configImports: ['@kit/feedback'],
    npmDependencies: ['@kit/feedback'],
    envVarPrefixes: [],
  },
  {
    pluginId: 'waitlist',
    directories: ['packages/plugins/waitlist'],
    keyFiles: ['packages/plugins/waitlist/package.json'],
    configImports: ['@kit/waitlist'],
    npmDependencies: ['@kit/waitlist'],
    envVarPrefixes: [],
  },
  {
    pluginId: 'testimonial',
    directories: ['packages/plugins/testimonial'],
    keyFiles: ['packages/plugins/testimonial/package.json'],
    configImports: ['@kit/testimonial'],
    npmDependencies: ['@kit/testimonial'],
    envVarPrefixes: [],
  },
  {
    pluginId: 'roadmap',
    directories: ['packages/plugins/roadmap'],
    keyFiles: ['packages/plugins/roadmap/package.json'],
    configImports: ['@kit/roadmap'],
    npmDependencies: ['@kit/roadmap'],
    envVarPrefixes: [],
  },
  {
    pluginId: 'kanban',
    directories: ['packages/plugins/kanban'],
    keyFiles: ['packages/plugins/kanban/package.json'],
    configImports: ['@kit/kanban'],
    npmDependencies: ['@kit/kanban'],
    envVarPrefixes: [],
  },
  {
    pluginId: 'text-editor',
    directories: ['packages/plugins/text-editor'],
    keyFiles: ['packages/plugins/text-editor/package.json'],
    configImports: ['@kit/text-editor'],
    npmDependencies: ['@kit/text-editor'],
    envVarPrefixes: ['OPENAI_API_KEY'],
  },
  {
    pluginId: 'google-analytics',
    directories: ['packages/plugins/analytics/google-analytics'],
    keyFiles: ['packages/plugins/analytics/google-analytics/package.json'],
    configImports: ['@kit/google-analytics'],
    npmDependencies: ['@kit/google-analytics'],
    envVarPrefixes: ['NEXT_PUBLIC_GOOGLE_ANALYTICS'],
  },
  {
    pluginId: 'posthog',
    directories: ['packages/plugins/analytics/posthog'],
    keyFiles: ['packages/plugins/analytics/posthog/package.json'],
    configImports: ['@kit/posthog'],
    npmDependencies: ['@kit/posthog'],
    envVarPrefixes: ['NEXT_PUBLIC_POSTHOG'],
  },
  {
    pluginId: 'umami',
    directories: ['packages/plugins/analytics/umami'],
    keyFiles: ['packages/plugins/analytics/umami/package.json'],
    configImports: ['@kit/umami'],
    npmDependencies: ['@kit/umami'],
    envVarPrefixes: ['NEXT_PUBLIC_UMAMI'],
  },
  {
    pluginId: 'signoz',
    directories: ['packages/plugins/signoz'],
    keyFiles: ['packages/plugins/signoz/package.json'],
    configImports: ['@kit/signoz'],
    npmDependencies: ['@kit/signoz'],
    envVarPrefixes: ['OTEL_EXPORTER'],
  },
  {
    pluginId: 'paddle',
    directories: ['packages/plugins/paddle'],
    keyFiles: ['packages/plugins/paddle/package.json'],
    configImports: ['@kit/paddle'],
    npmDependencies: ['@kit/paddle'],
    envVarPrefixes: ['PADDLE_', 'NEXT_PUBLIC_PADDLE'],
  },
  {
    pluginId: 'supabase-cms',
    directories: ['packages/plugins/supabase-cms'],
    keyFiles: ['packages/plugins/supabase-cms/package.json'],
    configImports: ['@kit/supabase-cms'],
    npmDependencies: ['@kit/supabase-cms'],
    envVarPrefixes: [],
  },
];

export function getPluginById(id: string): PluginDefinition | undefined {
  return PluginsModel[id];
}

export function validatePlugin(pluginId: string): PluginDefinition {
  const plugin = getPluginById(pluginId);

  invariant(plugin, `Plugin "${pluginId}" not found`);

  return plugin;
}

export function getPluginSignature(
  pluginId: string,
): PluginSignature | undefined {
  return PluginSignatures.find((s) => s.pluginId === pluginId);
}
