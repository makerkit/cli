import {Command} from "commander";
import prompts from "prompts";
import chalk from "chalk";
import {z} from "zod";
import ora from "ora";

const schema = z.object({
    licenseKey: z.string().min(1).max(32),
    githubUsername: z.string().min(1).max(64),
});

export function createActivateLicenseCommand(parentCommand: Command) {
    return parentCommand
        .command('activate')
        .description(
            'Activate your license key for MakerKit'
        )
        .action(async () => {
            const params = await prompts([{
                type: 'text',
                name: 'licenseKey',
                message: `Enter your ${chalk.cyan('License Key')}.`,
                validate: (value) => {
                    if (value.length < 1) {
                        return `Please enter a valid license key`;
                    }

                    return true;
                }
            }, {
                type: 'text',
                name: 'githubUsername',
                message: `Enter your ${chalk.cyan('Github username')}.`,
                validate: (value) => {
                    if (value.length < 1) {
                        return `Please enter a valid username`;
                    }

                    return true;
                },
            }]);

            const spinner = ora(`Activating license...`).start();

            const onError = () => {
                spinner.fail(`Failed to activate license`);
                process.exit(1);
            };

            try {
                const response = await activateLicense(schema.parse(params));

                if (!response.ok) {
                    return onError();
                }

                spinner.succeed(`License activated successfully`);
            } catch (e) {
                onError();
            }
        });
}

async function activateLicense(params: {
    licenseKey: string;
    githubUsername: string;
}) {
    return fetch(`https://makerkit.dev/api/ls/license/activate`, {
        method: 'POST',
        body: JSON.stringify(params)
    });
}
