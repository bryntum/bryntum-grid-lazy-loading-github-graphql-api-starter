import { useMemo, useRef, useState
} from 'react';
import { BryntumTreeGrid } from '@bryntum/grid-react';
import { createGridConfig } from '@/gridConfig';
import { createGitHubIssueStore } from '@/storeConfig';

export type NetworkValueTypes = {
  text: 'Idle' | 'Loading' | 'Committing';
  color: 'green' | 'blue' | 'red';
};

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
        createGridConfig({
            networkValue,
            store }),
    [networkValue, store]
    );

    return (
        <BryntumTreeGrid {...gridProps} ref={gridRef} />
    );
}