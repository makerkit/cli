import { generateBlogCommand } from '@/src/commands/blog/generate/generate-blog.command';
import { Workspace } from '@/src/utils/workspace';
import { Command } from 'commander';

export const blogCommand = new Command()
  .name('blog')
  .description('Manage and generate your blog posts')
  .hook('preAction', () => {
    return Workspace.logWorkspaceInfo();
  });

// set children commands
generateBlogCommand(blogCommand);
