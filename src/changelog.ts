import {ChangelogRelease} from "./changelog-release";

export interface Changelog {
    title: string;
    releases: ChangelogRelease[];
}