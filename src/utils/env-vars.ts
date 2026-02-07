import { join } from 'path';

import fs from 'fs-extra';

import type { EnvVar } from '@/src/plugins-model';

const ENV_FILES = ['.env.example', '.env.local'];

export async function appendEnvVars(
  envVars: EnvVar[],
  pluginName: string,
): Promise<void> {
  if (envVars.length === 0) {
    return;
  }

  const sectionHeader = `# ${pluginName} Plugin`;

  for (const envFile of ENV_FILES) {
    const filePath = join(process.cwd(), envFile);

    let content = '';

    if (await fs.pathExists(filePath)) {
      content = await fs.readFile(filePath, 'utf-8');
    }

    // Check if section already exists (idempotent)
    if (content.includes(sectionHeader)) {
      continue;
    }

    const lines: string[] = [];

    if (content.length > 0 && !content.endsWith('\n')) {
      lines.push('');
    }

    lines.push('');
    lines.push(sectionHeader);

    for (const envVar of envVars) {
      lines.push(`# ${envVar.description}`);
      lines.push(`${envVar.key}=${envVar.defaultValue ?? ''}`);
    }

    lines.push('');

    await fs.appendFile(filePath, lines.join('\n'));
  }
}
