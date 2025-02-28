import dynamic from 'next/dynamic';

const Grid = dynamic(
    () => import('../components/Grid'), { ssr : false }
);

const GridWrapper = () => {

    return (
        <Grid />
    );
};

export default GridWrapper;
