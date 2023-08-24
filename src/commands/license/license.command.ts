import {Command} from "commander";
import {
    createActivateLicenseCommand
} from "@/src/commands/license/activate/activate-license.command";

export const licenseCommand = new Command()
    .name('license')
    .description('Manage Licenses');

createActivateLicenseCommand(licenseCommand);