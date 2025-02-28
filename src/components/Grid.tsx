import { GridRowModel, StoreConfig, StringHelper } from '@bryntum/grid';
import { BryntumTreeGrid, BryntumTreeGridProps } from '@bryntum/grid-react';
import {  useMemo, useRef, useState } from 'react';

type NetworkValueTypes = {
  text: 'Idle' | 'Loading' | 'Committing';
  color: 'green' | 'blue' | 'red';
};

class GitHubIssue extends GridRowModel {
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

// Transform a parent node to a leaf node when all its children are removed
GitHubIssue.convertEmptyParentToLeaf = true;

type OnAfterRequest = Response & {
  parsedJson: {
    endCursor: string;
    commentEndCursor: string;
    total: number;
  };
};

export default function Grid() {
    const gridRef = useRef<BryntumTreeGrid>(null);
    const [networkValue, setNetworkValue] = useState<NetworkValueTypes>({
        text  : 'Idle',
        color : 'green'
    });
    const endCursorRef = useRef<string | null>(null);
    const commentEndCursorRef = useRef<string | null>(null);

    const store: StoreConfig = useMemo(() => ({
        modelClass : GitHubIssue,
        readUrl    : '/api/read',
        onBeforeLoad({ params }: { params: {endCursor: string | null, commentEndCursor: string | null } }) {
            params.endCursor = endCursorRef.current;
            params.commentEndCursor = commentEndCursorRef.current;
        },
        onAfterRequest({ response }) {
            const res = response as OnAfterRequest;
            // end cursor for lazy loading issues
            if (res.parsedJson.commentEndCursor === undefined) {
                endCursorRef.current = res.parsedJson.endCursor;
            }
            // end cursor for lazy loading comments
            else {
                commentEndCursorRef.current = res.parsedJson.commentEndCursor;
            }

            if (gridRef.current?.instance && res.parsedJson.total) {
                // @ts-expect-error getById is not in the type definition
                const column = gridRef.current.instance.columns.getById('IssuesAndComments');
                if (column) {
                    column.set({
                        text : `Total issues: ${res.parsedJson.total}`
                    });
                }
            }
        },
        lazyLoad : {
            chunkSize : 100 // default value
        },
        listeners : {
            lazyLoadStarted() {
                setNetworkValue({
                    text  : 'Loading',
                    color : 'blue'
                });

            },
            lazyLoadEnded() {
                setNetworkValue({
                    text  : 'Idle',
                    color : 'green'
                });
            }
        },
        autoLoad : true
    }), []);

    const gridProps: BryntumTreeGridProps = {
        animateTreeNodeToggle : true,
        filterFeature         : {
            allowedOperators : ['includes'],
            pickerConfig     : {
                showAddFilterButton : false
            }
        },
        summaryFeature     : true,
        cellTooltipFeature : {
            hoverDelay      : 300,
            textContent     : true,
            tooltipRenderer : ({ record }) => {
                if (record.getData('number')) return null;
                return StringHelper.encodeHtml(record.getData('title'));
            }
        },
        sortFeature : false,
        readOnly    : true,
        store,
        columns     : [
            {
                type            : 'number',
                field           : 'number',
                text            : 'Issue #',
                width           : 180,
                filterable      : false,
                tooltipRenderer : false,
                sum             : 'count',
                summaryRenderer : ({ sum }) => `Total loaded: ${sum}`
            },
            {
                id    : 'IssuesAndComments',
                type  : 'tree',
                field : 'title',
                flex  : 1

            },
            {
                field           : 'author',
                text            : 'Author',
                width           : 210,
                filterable      : false,
                tooltipRenderer : false
            }
        ],
        tbar : [
            {
                type  : 'container',
                style : StringHelper.xss`width: 500px; color: black;`,
                items : [{
                    type  : 'display',
                    value : 'GitHub Issues and comments for the VS Code repository'
                }]
            },
            {
                type  : 'container',
                style : StringHelper.xss`width: 220px; margin-left: auto;  color: ${networkValue.color}`,
                items : [{
                    type  : 'display',
                    value : `Network status: ${networkValue.text}`
                }]
            }
        ]
    };

    return (
        <BryntumTreeGrid {...gridProps} ref={gridRef} />
    );
}