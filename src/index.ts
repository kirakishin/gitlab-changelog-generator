import {ConfigInterface, LOG_LEVEL} from './config.interface';
import {Generator} from "./generator";
import {template} from "./template";

let options = require('minimist')(process.argv.slice(2));

if (!options.token || !options.url || !options.projectId || !options.destFile) {
    console.error(Generator.debugPrefix, 'you must passing these arguments: token, url, projectId, destFile');
    process.exit(1);
}

let logLevel: LOG_LEVEL = LOG_LEVEL.LOG;
if (options.logLevel) {
    console.info(Generator.debugPrefix, 'logLevel options set to', options.logLevel);
    logLevel = LOG_LEVEL[`${options.logLevel}`];
}

let config: ConfigInterface = {
    gitlab: {
        token: options.token,
        url: options.url
    },
    projectId: options.projectId,
    destFile: options.destFile,
    logLevel: logLevel
};

let generator = new Generator(config, template);
generator.generate()
    .subscribe(
        (status: string) => {
            console.info(Generator.debugPrefix, 'Succeeded', `status: ${status}`);
        },
        (status: string) => {
            console.info(Generator.debugPrefix, 'Error', `status: ${status}`);
        }
    );