import { createGridConfig } from '@/gridConfig';
import { createGitHubIssueStore, NetworkValueTypes } from '@/storeConfig';
import { BryntumTreeGrid } from '@bryntum/grid-react';
import {  useMemo, useRef, useState } from 'react';

export default function Grid() {
    const gridRef = useRef<BryntumTreeGrid>(null);
    const [networkValue, setNetworkValue] = useState<NetworkValueTypes>({
        text  : 'Idle',
        color : 'green'
    });
    const endCursorRef = useRef<string | null>(null);
    const commentEndCursorRef = useRef<string | null>(null);

    const store = useMemo(() =>
        createGitHubIssueStore(
            gridRef,
            endCursorRef,
            commentEndCursorRef,
            setNetworkValue
        ),
    []
    );

    const gridProps = useMemo(() =>
        createGridConfig({ networkValue, store }),
    [networkValue, store]
    );

    return (
        <BryntumTreeGrid {...gridProps} ref={gridRef} />
    );
}