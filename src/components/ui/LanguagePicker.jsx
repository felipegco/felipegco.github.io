"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LanguagePicker({ lang }) {
    const pathname = usePathname();

    const redirectedPathname = (locale) => {
        if (!pathname) return "/";
        const segments = pathname.split("/");
        segments[1] = locale;
        return segments.join("/");
    };

    return (
        <Link
            href={redirectedPathname(lang === "pt" ? "en" : "pt")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-xs font-bold text-[#a1a1a1] hover:text-[#ededed]"
        >
            <i className="fa-solid fa-globe text-blue-500"></i>
            {lang === "pt" ? "EN" : "PT"}
        </Link>
    );
}