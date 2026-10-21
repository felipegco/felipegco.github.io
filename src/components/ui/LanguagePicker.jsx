"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LanguagePicker({ lang, labels }) {
    const pathname = usePathname();

    const redirectedPathname = (locale) => {
        if (!pathname) return `/${locale}`;
        const segments = pathname.split("/");
        // O locale é sempre o primeiro segmento (felipegco.github.io/pt)
        segments[1] = locale;
        return segments.join("/");
    };

    return (
        <Link
            href={redirectedPathname(lang === "pt" ? "en" : "pt")}
            className="tool"
            aria-label={labels.switchLang}
            title={labels.switchLang}
        >
            {labels.langShort}
        </Link>
    );
}
