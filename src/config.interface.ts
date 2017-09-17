export enum LOG_LEVEL { OFF = 0, ERROR = 1, WARN = 2, INFO = 3, LOG = 4 }

export interface ConfigInterface {
    gitlab: {
        url: string,
        token: string
    };
    projectId: string;
    destFile: string;
    logLevel: LOG_LEVEL;
}