import invariant from 'tiny-invariant';

export const PluginsModel = {
  CookieBanner: {
    name: `Cookie Banner`,
    id: `cookie-banner`,
    branch: `cookie-banner`,
    description: `Add a cookie banner to your site.`,
  },
  AiChatBot: {
    name: `AI Chatbot`,
    id: `chatbot`,
    branch: `chatbot`,
    description: `Add an AI Chatbot to your site.`,
  },
  FeedbackPopup: {
    name: `Feedback Popup`,
    id: `feedback-popup`,
    branch: `feedback-popup`,
    description: `Add a feedback popup to your site.`,
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
