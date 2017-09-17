import {ChangelogReleaseChange} from "./changelog-release-change";

export interface ChangelogRelease {
    title: string,
    changes: ChangelogReleaseChange[]
}