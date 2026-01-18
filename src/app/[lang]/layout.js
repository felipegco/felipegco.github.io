import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "Felipe.dev"
};

export async function generateStaticParams() {
    return [{ lang: 'pt' }, { lang: 'en' }];
}

export default async function RootLayout({ children, params }) {
    const { lang } = await params;

    return (
        <html lang={lang}>
        <head>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
        </head>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        {children}
        </body>
        </html>
    );
}