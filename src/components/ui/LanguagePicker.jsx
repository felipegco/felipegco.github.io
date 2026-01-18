"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LanguagePicker({ lang }) {
    const pathname = usePathname();

    const redirectedPathname = (locale) => {
        if (!pathname) return "/";
        const segments = pathname.split("/");

        const isGithubPages = segments[1] === "portifolio-v2";
        const localeIndex = isGithubPages ? 2 : 1;

        segments[localeIndex] = locale;
        return segments.join("/");
    };

    return (
        <Link
            href={redirectedPathname(lang === "pt" ? "en" : "pt")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-bold"
            style={{
                borderColor: 'var(--border)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary)'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
            }}
        >
            <i className="fa-solid fa-globe text-blue-500"></i>
            {lang === "pt" ? "EN" : "PT"}
        </Link>
    );
}