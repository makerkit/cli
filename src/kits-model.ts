import { PluginsModel } from '@/src/plugins-model';
import invariant from 'tiny-invariant';

export const KitsModel = {
  NextJsFirebase: {
    name: `Next.js Firebase`,
    id: `next-firebase`,
    repository: `git@github.com:makerkit/next-firebase-saas-kit`,
    blogPath: `_posts`,
    localePath: `public/locales`,
    plugins: [
      PluginsModel.CookieBanner.id,
      PluginsModel.AiChatBot.id,
      PluginsModel.FeedbackPopup.id,
    ],
  },
  NextJsSupabase: {
    name: `Next.js Supabase`,
    id: `next-supabase`,
    localePath: `public/locales`,
    blogPath: `src/content/posts`,
    repository: `git@github.com:makerkit/next-supabase-saas-kit`,
    plugins: [
      PluginsModel.AiChatBot.id,
      PluginsModel.FeedbackPopup.id,
      PluginsModel.CookieBanner.id,
      PluginsModel.AiTextEditor.id,
    ],
  },
  NextJsSupabaseTurbo: {
    name: `Next.js Supabase Turbo`,
    id: `next-supabase-turbo`,
    localePath: `apps/web/public/locales`,
    blogPath: `apps/web/content/posts`,
    repository: `git@github.com:makerkit/next-supabase-saas-kit-turbo`,
    plugins: [
      PluginsModel.Waitlist.id,
      PluginsModel.Testimonial.id,
      PluginsModel.Roadmap.id,
      PluginsModel.Kanban.id,
      PluginsModel.AiChatBotTurbo.id,
      PluginsModel.FeedbackPopupTurbo.id,
      PluginsModel.AiTextEditorTurbo.id,
      PluginsModel.GoogleAnalytics.id,
      PluginsModel.Posthog.id,
      PluginsModel.Umami.id,
      PluginsModel.Signoz.id,
      PluginsModel.Paddle.id,
    ],
  },
  RemixSupabaseTurbo: {
    name: `Remix Supabase Turbo`,
    id: `remix-supabase-turbo`,
    localePath: `apps/web/public/locales`,
    blogPath: `apps/web/content/posts`,
    repository: `git@github.com:makerkit/remix-supabase-saas-kit-turbo`,
    plugins: [
      PluginsModel.Waitlist.id,
      PluginsModel.Testimonial.id,
      PluginsModel.AiChatBotTurbo.id,
      PluginsModel.FeedbackPopupTurbo.id,
      PluginsModel.AiTextEditorTurbo.id,
      PluginsModel.GoogleAnalytics.id,
      PluginsModel.Posthog.id,
      PluginsModel.Umami.id,
    ],
  },
  NextJsSupabaseLite: {
    name: `Next.js Supabase Lite`,
    id: `next-supabase-lite`,
    localePath: `public/locales`,
    blogPath: `src/content/posts`,
    repository: `git@github.com:makerkit/next-supabase-saas-kit-lite`,
    plugins: [],
  },
  RemixFirebase: {
    name: `Remix Firebase`,
    id: `remix-firebase`,
    localePath: `public/locales`,
    blogPath: '',
    repository: `git@github.com:makerkit/remix-firebase-saas-kit`,
    plugins: [],
  },
  RemixSupabase: {
    name: `Remix Supabase`,
    id: `remix-supabase`,
    localePath: `public/locales`,
    blogPath: `app/content/posts`,
    repository: `git@github.com:makerkit/remix-supabase-saas-kit`,
    plugins: [
      PluginsModel.AiChatBot.id,
      PluginsModel.FeedbackPopup.id,
      PluginsModel.CookieBanner.id,
      PluginsModel.AiTextEditor.id,
    ],
  },
};

export function getKitById(id: string) {
  return Object.values(KitsModel).find((kit) => kit.id === id);
}

export function validateKit(kitId: string) {
  const kit = getKitById(kitId);

  invariant(kit, `Kit ${kitId} not found`);

  return kit;
}
