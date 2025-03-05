
import { AjaxStore, StringHelper } from '@bryntum/grid';
import { BryntumTreeGridProps } from '@bryntum/grid-react';
import { NetworkValueTypes } from './components/Grid';

type GridConfigOptions = {
  networkValue: NetworkValueTypes;
  store: AjaxStore;
};

export function createGridConfig(
    {
        networkValue,
        store
    }: GridConfigOptions
): BryntumTreeGridProps {
    return {
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
                style : StringHelper.xss`width: 220px; margin-left: auto; color: ${networkValue.color}`,
                items : [{
                    type  : 'display',
                    value : `Network status: ${networkValue.text}`
                }]
            }
        ]
    };
}