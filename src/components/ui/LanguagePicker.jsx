"use client";

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

    // Um <a> comum, não o <Link>: trocar de idioma recarrega a página. A navegação no
    // cliente redesenharia o layout raiz, e o script do tema no <head> (que precisa rodar
    // antes da pintura) viraria um <script> renderizado pelo React, que nunca executa.
    return (
        <a
            href={redirectedPathname(lang === "pt" ? "en" : "pt")}
            className="tool"
            aria-label={labels.switchLang}
            title={labels.switchLang}
        >
            {labels.langShort}
        </a>
    );
}
