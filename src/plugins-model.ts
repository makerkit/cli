import invariant from 'tiny-invariant';

export const PluginsModel = {
  CookieBanner: {
    name: `Cookie Banner`,
    id: `cookie-banner`,
    branch: `cookie-banner`,
    description: `Add a cookie banner to your site.`,
    folder: `plugins/cookie-banner`,
  },
  AiChatBot: {
    name: `AI Chatbot`,
    id: `chatbot-v1`,
    branch: `chatbot`,
    description: `Add an AI Chatbot to your site.`,
    folder: `plugins/chatbot`,
  },
  FeedbackPopup: {
    name: `Feedback Popup`,
    id: `feedback-popup-v1`,
    branch: `feedback-popup`,
    description: `Add a feedback popup to your site.`,
    folder: `plugins/feedback-popup`,
  },
  AiTextEditor: {
    name: `AI Text Editor`,
    id: `text-editor-v1`,
    branch: `text-editor`,
    description: `Add an AI Text Editor to your site.`,
    folder: `plugins/text-editor`,
  },
  AiTextEditorTurbo: {
    name: `AI Text Editor`,
    id: `text-editor`,
    branch: `text-editor`,
    description: `Add an AI Text Editor to your site.`,
    folder: `packages/plugins/text-editor`,
  },
  Waitlist: {
    name: `Waitlist`,
    id: `waitlist`,
    branch: `waitlist`,
    description: `Add a waitlist to your site.`,
    folder: `packages/plugins/waitlist`,
  },
  FeedbackPopupTurbo: {
    name: `Feedback Popup`,
    id: `feedback`,
    branch: `feedback`,
    description: `Add a feedback popup to your site.`,
    folder: `packages/plugins/feedback`,
  },
  AiChatBotTurbo: {
    name: `AI Chatbot`,
    id: `chatbot`,
    branch: `chatbot`,
    description: `Add an AI Chatbot to your site.`,
    folder: `packages/plugins/chatbot`,
  },
  Testimonial: {
    name: `Testimonial`,
    id: `testimonial`,
    branch: `testimonial`,
    description: `Add a testimonial to your site.`,
    folder: `packages/plugins/testimonial`,
  },
  Roadmap: {
    name: `Roadmap`,
    id: `roadmap`,
    branch: `roadmap`,
    description: `Add a Roadmap to your site.`,
    folder: `packages/plugins/roadmap`,
  },
  Kanban: {
    name: `Kanban`,
    id: `kanban`,
    branch: `kanban`,
    description: `Add a Kanban component to your site.`,
    folder: `packages/plugins/kanban`,
  },
  GoogleAnalytics: {
    name: `Google Analytics`,
    id: `google-analytics`,
    branch: `google-analytics`,
    description: `Add Google Analytics to your site.`,
    folder: `packages/plugins/analytics/google-analytics`,
  },
  Posthog: {
    name: `Posthog`,
    id: `posthog`,
    branch: `posthog`,
    description: `Add Posthog Analytics to your site.`,
    folder: `packages/plugins/analytics/posthog`,
  },
  Umami: {
    name: `Umami`,
    id: `umami`,
    branch: `umami`,
    description: `Add Umami Analytics to your site.`,
    folder: `packages/plugins/analytics/umami`,
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
