import invariant from 'tiny-invariant';

export const PluginsModel = {
  CookieBanner: {
    name: `Cookie Banner`,
    id: `cookie-banner`,
    branch: `cookie-banner`,
    description: `Add a cookie banner to your site.`,
  },
};

export function getPluginById(id: string) {
  return Object.values(PluginsModel).find((plugin) => plugin.id === id);
}

export function validatePlugin(pluginId: string) {
  const plugin = getPluginById(pluginId);

  invariant(plugin, `Plugin ${pluginId} not found`);

  return plugin;
}
