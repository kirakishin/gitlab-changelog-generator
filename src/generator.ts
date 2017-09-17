import {GeneratorInterface} from "./generator.interface";
import {AsyncSubject, Observable, ReplaySubject} from "rxjs";
import 'rxjs/add/operator/takeUntil';
import {Changelog} from "./changelog";
import {ChangelogRelease} from "./changelog-release";
import {ChangelogReleaseChange} from "./changelog-release-change";
import {writeFileSync} from 'fs';
import {ConfigInterface, LOG_LEVEL} from "./config.interface";
import 'rxjs/add/observable/forkJoin';

const Handlebars = require('handlebars');
const path = require("path");


export class Generator implements GeneratorInterface {
    public static debugPrefix: string = '[gitlab-changelog-generator]';
    private gitlabApi: any;

    constructor(private config: ConfigInterface, private template: string) {
        this.gitlabApi = require('gitlab')(config.gitlab);
        this.logger.info('generator initialized');
    }

    public generate(): AsyncSubject<string> {
        this.logger.log(Generator.debugPrefix, 'generate prepared');
        let changelogData: Changelog = {
            title: 'Changelog',
            releases: []
        };

        return Observable.create(
            (generationStatus: AsyncSubject<string>) => {
                this.logger.info(Generator.debugPrefix, 'generating changelog...');
                this.awaitMilestones()
                // .takeUntil(generationStatus)
                    .subscribe(
                        (milestones: Array<any>) => {
                            let milestonesDataProcessings: ReplaySubject<number>[] = [];

                            milestones = milestones.sort((a, b) => b.id - a.id);
                            for (let ms of milestones) {
                                this.processMilestoneData(ms, milestonesDataProcessings, changelogData);
                            }

                            this.onAllMilestonesDataProcessed(milestonesDataProcessings)
                                .subscribe(
                                    () => {
                                        if (this.processChangelogDataToMarkdownFile(changelogData)) {
                                            this.logger.info(Generator.debugPrefix, 'changelog generated');
                                            generationStatus.next('OK');
                                        } else {
                                            this.logger.info(Generator.debugPrefix, 'changelog generation error');
                                            generationStatus.next('changelog generation error');
                                        }
                                    }
                                )
                        }
                    )
            });
    }

    private get logger(): { error: Function, warn: Function, info: Function, log: Function } {
        let e = () => {
        };
        if (this.config.logLevel >= LOG_LEVEL.OFF) {
            return {
                error: console.error.bind(console.error, Generator.debugPrefix),
                warn: this.config.logLevel >= LOG_LEVEL.WARN ? console.warn.bind(console.warn, Generator.debugPrefix) : e,
                info: this.config.logLevel >= LOG_LEVEL.INFO ? console.info.bind(console.info, Generator.debugPrefix) : e,
                log: this.config.logLevel >= LOG_LEVEL.LOG ? console.log.bind(console.log, Generator.debugPrefix) : e
            };
        }
        return {error: console.error.bind(console.error, Generator.debugPrefix), warn: e, info: e, log: e};
    }

    private processChangelogDataToMarkdownFile(changelogData: Changelog) {
        let file = this.config.destFile;
        this.logger.log(`saving content in file: ${file}`);
        let generator = Handlebars.compile(this.template);
        let content = generator(changelogData);

        try {
            writeFileSync(path.resolve(__dirname, file), content, 'utf-8');
            this.logger.info(`changelog saved in file: ${file}`);
        } catch (e) {
            this.logger.error(`fail to save in file: ${file}`, e);
            return false;
        }
        return true;
    }

    private onAllMilestonesDataProcessed(milestonesDataProcessings: ReplaySubject<number>[]) {
        return Observable.create(
            (observer: AsyncSubject<any>) => {
                this.logger.log('waiting for all milestones MRs receives');
                Observable.forkJoin(...milestonesDataProcessings)
                    .subscribe(
                        (allMilestoneMergeRequestsStatus: any) => {
                            if (allMilestoneMergeRequestsStatus.every((elt: number) => elt !== 0)) {
                                this.logger.log('all milestones MRs received');
                                observer.next(true);
                            }
                        }
                    );
            });
    }

    private processMilestoneData(ms: any, allRequestsObservables: ReplaySubject<number>[], changelogData: any) {
        let title = `${(ms.title || 'unknown')}`;
        this.logger.log(`process milestone data for #${ms.id} - ${title}`);
        let milestoneData: ChangelogRelease = {
            title: title,
            changes: []
        };
        changelogData.releases.push(milestoneData);
        let fetchingRequest: ReplaySubject<number> = new ReplaySubject(0);

        this.processMilestoneMergeRequestsData(ms.id, milestoneData, fetchingRequest);

        allRequestsObservables.push(fetchingRequest);
    }

    private processMilestoneMergeRequestsData(id: string, milestoneData: any, fetchingRequest: ReplaySubject<number>) {
        this.awaitMilestoneMergeRequests(id)
            .subscribe(
                (milestoneMergeRequests: any) => {
                    this.logger.log(`got MRs of milestone #${id}`);
                    if (milestoneMergeRequests && milestoneMergeRequests.length > 0) {
                        for (let mr of milestoneMergeRequests) {
                            let change: ChangelogReleaseChange = {
                                id: mr.id,
                                title: mr.title || `Merge Request #${mr.id}`,
                                link: mr.web_url || ''
                            };
                            this.logger.log(`got MR #${mr.id} of milestone #${id}:`, change.title);
                            milestoneData.changes.push(change);
                        }
                    }
                    this.logger.log(`send that the MRs of milestone #${id} are received with success`);
                    fetchingRequest.next(1);
                    fetchingRequest.complete();
                },
                (error: any) => {
                    this.logger.log(`send that the MRs of milestone #${id} are in error`);
                    fetchingRequest.next(-1);
                    fetchingRequest.complete();
                }
            );
    }

    private awaitMilestones(): AsyncSubject<any> {
        return this.toObservable(
            this.gitlabApi.projects.milestones.all.bind(null, this.config.projectId)
        );
    }

    private awaitMilestoneMergeRequests(milestoneId: string): AsyncSubject<any> {
        return this.toObservable(
            this.gitlabApi.projects.milestones.showMergeRequests.bind(null, this.config.projectId, milestoneId)
        );
    }

    private toObservable(cb: any): AsyncSubject<any> {
        return Observable.create(
            (observer: AsyncSubject<any>) => {
                if (cb && typeof cb === 'function') {
                    let res: any;
                    try {
                        res = cb(
                            (data: any) => {
                                observer.next(data);
                                observer.complete();
                            }
                        );
                    } catch (e) {
                        observer.error('cb error');
                    }
                }
            }
        );
    }
}