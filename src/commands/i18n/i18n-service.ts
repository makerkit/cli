import { join } from 'path';
import getOpenAIClient from '@/src/utils/openai-client';
import { Workspace } from '@/src/utils/workspace';
import chalk from 'chalk';
import fs from 'fs-extra';
import OpenAI from 'openai';

type NestedKey = Record<string, string | Record<string, string>>;

export class I18nService {
  /**
   * @name verify
   * @description Verifies if the locale files are in sync
   */
  static async verify(base = 'en') {
    const kit = await Workspace.getKitMeta();

    const allLocales = fs.readdirSync(kit.localePath).filter((locale) => {
      return locale !== base;
    });

    const baseLocaleFolderPath = `${kit.localePath}/${base}`;

    const localeFiles = fs.readdirSync(baseLocaleFolderPath).filter((file) => {
      return file.endsWith('.json');
    });

    for (const localeFile of localeFiles) {
      for (const locale of allLocales) {
        const baseLocaleFilePath = `${baseLocaleFolderPath}/${localeFile}`;
        const targetLocaleFilePath = `${kit.localePath}/${locale}/${localeFile}`;

        const baseLocaleFile = fs.readJSONSync(baseLocaleFilePath);
        const file = fs.readJSONSync(targetLocaleFilePath);

        const missingKeys = collectMissingKeys([baseLocaleFile, file]);

        if (!missingKeys.length) {
          console.log(
            chalk.green(`Locale ${locale}/${localeFile} is in sync!`)
          );

          continue;
        }

        console.log(
          chalk.yellow(
            `Locale ${locale}/${localeFile} is missing the following keys: ${missingKeys.join(
              ', '
            )}`
          )
        );
      }
    }
  }

  /**
   * @name translate
   * @description Translates the locale files from source to target
   * @param source
   * @param target
   */
  static async translate(source: string, target: string) {
    const kit = await Workspace.getKitMeta();
    const client = getOpenAIClient();

    const targetJsonPath = `${kit.localePath}/${target}`;
    const sourceLocalePath = `${kit.localePath}/${source}`;

    const sourceLocale = await fs.exists(sourceLocalePath);

    if (!sourceLocale) {
      throw new Error(`Source locale at ${sourceLocalePath} not found`);
    }

    const files = fs.readdirSync(sourceLocalePath).filter((file) => {
      return file.endsWith('.json');
    });

    console.log(`Found the following files: ${files.join(', ')}`);

    for (const file of files) {
      const data: Record<string, string | Record<string, string | NestedKey>> =
        {};

      const localeFile = fs.readJSONSync(join(sourceLocalePath, file));

      console.log(
        chalk.cyan(`Translating "${file}". This can take a while...`)
      );

      for (const key in localeFile) {
        data[key] = await translateKey(source, target, localeFile[key], client);
      }

      console.log(chalk.green(`File "${file}" successfully translated!`));
      console.log(chalk.cyan(`Writing file "${file}" to ${targetJsonPath}`));

      // check if targetJsonPath exists, if not, create it
      (await fs.exists(targetJsonPath)) || (await fs.mkdir(targetJsonPath));

      // write file to targetJsonPath
      await fs.writeJSON(join(targetJsonPath, file), data, {});

      console.log(chalk.green(`File "${file}" successfully written!`));
    }
  }
}

async function translateKey(
  source: string,
  target: string,
  key: string | NestedKey,
  client: OpenAI
) {
  if (typeof key === 'string') {
    return translateString(source, target, key, client);
  }

  const data: Record<string, string | NestedKey> = {};

  for (const k in key) {
    data[k] = (await translateKey(source, target, key[k], client)) as NestedKey;
  }

  return data;
}

async function translateString(
  source: string,
  target: string,
  key: string,
  client: OpenAI
) {
  // skip empty or short keys
  if (!key.trim() || key.length <= 1) {
    return '';
  }

  const response = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    max_tokens: target.split(' ').length + 50,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: `Translate the text from locale ${source} to ${target}. Text: ${key}. Translation:`,
      },
    ],
  });

  return response.choices[0].message.content ?? '';
}

type JSONObject = { [key: string]: any };

function collectMissingKeys(objects: JSONObject[]): string[] {
  const allKeys: string[] = [];

  objects.forEach((obj) => {
    Object.keys(obj).forEach((key) => {
      if (!allKeys.includes(key)) {
        allKeys.push(key);
      }
    });
  });

  const missingKeys: string[] = [];

  objects.forEach((obj) => {
    allKeys.forEach((key) => {
      if (!Object.keys(obj).includes(key)) {
        missingKeys.push(key);
      }
    });
  });

  return missingKeys;
}
