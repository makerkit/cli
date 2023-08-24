#!/usr/bin/env node
import {i18nCommand} from '@/src/commands/i18n/i18n.command';
import {newCommand} from '@/src/commands/new/new.command';
import {pluginsCommand} from '@/src/commands/plugins/plugins.command';
import {licenseCommand} from "@/src/commands/license/license.command";

import {Command} from 'commander';
import {config} from 'dotenv';

config({
    path: '.env.local',
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

async function main() {
    const program = new Command()
        .name('makerkit')
        .description(
            'Your SaaS Kit companion. Add plugins, manage migrations, and more.'
        )
        .version('-v, --version', 'display the version number');

    program
        .addCommand(newCommand)
        .addCommand(pluginsCommand)
        .addCommand(i18nCommand)
        .addCommand(licenseCommand);

    program.parse();
}

void main();
