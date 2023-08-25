import { join } from 'path';
import { KitsModel } from '@/src/kits-model';
import getOpenAIClient from '@/src/utils/openai-client';
import { Workspace } from '@/src/utils/workspace';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import ora from 'ora';
import prompts from 'prompts';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1).max(70),
  category: z.string().min(1).max(70),
  wordCount: z.number().min(250).max(2500),
  prompt: z
    .string()
    .optional()
    .transform((value) => value || ''),
});

export function generateBlogCommand(parentCommand: Command) {
  return parentCommand
    .command('generate')
    .description('Generate your blog posts with AI')
    .action(async () => {
      const { title, prompt, category, wordCount } = schema.parse(
        await getPrompts()
      );

      const content = await generateBlogPost({ title, prompt, wordCount });
      const mdx = await getMdxPostTemplate({ title, category, content });

      return writeMdxPostTemplate(mdx, title);
    });
}

export function getPrompts() {
  return prompts([
    {
      type: 'text',
      name: 'title',
      message: `Enter your ${chalk.cyan('title')}.`,
    },
    {
      type: 'text',
      name: 'category',
      message: `Enter your ${chalk.cyan(
        'category'
      )}. If it doesn't exist yet, you will need to add it manually to your blog.`,
    },
    {
      type: 'number',
      name: 'wordCount',
      message: `Enter your target ${chalk.cyan(
        'word count'
      )} (from 250 words, up to 2500).`,
    },
    {
      type: 'text',
      name: 'prompt',
      message: `Would you like to add your own instructions to the AI? (optional)`,
    },
  ]);
}

async function generateBlogPost(params: {
  title: string;
  prompt: string;
  wordCount: number;
}) {
  const client = getOpenAIClient();
  const prompt = getPostPrompt(params);
  const spinner = ora(`Generating blog post...`).start();

  try {
    const response = await client.chat.completions.create({
      model: `gpt-3.5-turbo`,
      messages: [
        {
          role: 'user' as const,
          content: prompt,
        },
      ],
      max_tokens: params.wordCount,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content ?? '';

    spinner.succeed(`Blog post generated successfully`);
    console.log(`Used ${response.usage?.total_tokens} tokens`);

    return content;
  } catch (e) {
    console.error(e);
    spinner.fail(`Failed to generate blog post`);
    process.exit(1);
  }
}

async function getMdxPostTemplate(params: {
  title: string;
  category: string;
  content: string;
}) {
  const kit = await Workspace.getKitMeta();
  const isFirebaseKit = kit.id === KitsModel.NextJsFirebase.id;

  // we use different properties for firebase and supabase kits
  const categoryProp = isFirebaseKit ? 'collection' : 'category';
  const descriptionProp = isFirebaseKit ? 'excerpt' : 'description';
  const imageProp = isFirebaseKit ? 'coverImage' : 'image';

  return `
---
title: "${params.title}"
${categoryProp}: "${params.category}"
date: "${new Date().toISOString()}"
${descriptionProp}: ""
live: false
${imageProp}: ""
---

${params.content}
`.trim();
}

async function writeMdxPostTemplate(template: string, title: string) {
  const kit = await Workspace.getKitMeta();
  const spinner = ora(`Storing blog post...`).start();

  try {
    let blogPath = kit.blogPath;

    // when the kit does not have a blog path, we ask the user to provide one
    // this is the case for the Remix kits
    if (!blogPath) {
      blogPath = await prompts({
        type: 'text',
        name: 'blogPath',
        message: `This kit does not support blog posts yet. You can still generate a blog post, but you'll need to manually add it to your blog. Please enter your blog path (e.g. src/content/posts). The path needs to exist.`,
      }).then((response) => response.blogPath as string);
    }

    const slug = slugify(title);
    const path = join(process.cwd(), blogPath, `${slug}.mdx`);

    await fs.writeFile(path, template);

    spinner.succeed(`Blog post stored successfully`);
  } catch (e) {
    console.error(e);

    spinner.fail(`Failed to store blog post`);
  }
}

function getPostPrompt(params: {
  title: string;
  prompt: string;
  wordCount: number;
}) {
  return `
    Generate a professional blog post with title "${params.title}".
    Rules:
    
- The post must be below ${params.wordCount} words
- Output text using valid Markdown
- Write professional text while balancing simplicity and complexity in your language and sentence structures.
- Be an extremely smart, interesting, funny, witty, and confident writer. Readers admire you! 
- Use several paragraphs and an accurate level 2 and 3 headings before each paragraph to maximize readability.
- Do include level 4 headings (h4) to break complex paragraphs
- Ensure that headings do not include decimals or numbers with periods. Ensure they're formatted using Markdown.
- Repeat the main keywords and phrases often for SEO
  
  ${params.prompt ?? ''}
`.trim();
}

function slugify(text: string) {
  return (text ?? '')
    .toString()
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(/\_/g, '-')
    .replace(/\s+/g, '-')
    .replace(/\-\-+/g, '--')
    .replace(/\_$/g, '');
}
