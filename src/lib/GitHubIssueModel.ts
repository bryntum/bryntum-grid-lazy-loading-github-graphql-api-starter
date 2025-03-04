import { GridRowModel } from '@bryntum/grid';

export class GitHubIssueModel extends GridRowModel {
    static get fields() {
        return [
            'title',
            {
                name : 'number',
                type : 'number'
            },
            'author'
        ];
    }

}

GitHubIssueModel.convertEmptyParentToLeaf = true;