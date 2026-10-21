import { Geist, Geist_Mono } from "next/font/google"; // taste-skill-ignore
import "../globals.css";
import { getDictionary } from "@/lib/get-dictionary";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

// Geist Mono só aparece nos blocos de código reais (<pre><code>) taste-skill-ignore
const geistMono = Geist_Mono({ // taste-skill-ignore
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export async function generateMetadata({ params }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    return {
        title: dict.meta.title,
        description: dict.meta.description,
    };
}

export async function generateStaticParams() {
    return [{ lang: 'pt' }, { lang: 'en' }];
}

export default async function RootLayout({ children, params }) {
    const { lang } = await params;

    return (
        <html lang={lang} suppressHydrationWarning>
        <head>
            {/* Liga as animações de entrada antes da pintura; sem script, tudo aparece parado */}
            <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js');" }} />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable}`} /* taste-skill-ignore */ suppressHydrationWarning>
        {children}
        </body>
        </html>
    );
}
