import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
    variable : '--font-poppins',
    subsets  : ['latin'],
    weight   : ['300','400','500','600','700'],
    style    : ['normal']
});

export const metadata: Metadata = {
    title       : 'Bryntum tree Grid lazy loading, on demand data loading, and remote filtering.',
    description : 'Bryntum Grid showing GitHub Issues and comments for the VS Code repository.',
    icons       : {
        icon : '/bryntum.png'
    }
};


export default function RootLayout({
    children
}: Readonly<{
  children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${poppins.variable}`}>
                {children}
            </body>
        </html>
    );
}
