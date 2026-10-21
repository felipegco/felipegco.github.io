import LanguagePicker from '@/components/ui/LanguagePicker';

// Barra do topo: na página inicial os links são âncoras; nas páginas de projeto, voltam para ela
export default function Topbar({ nav, lang, home = false }) {
    const base = home ? '' : `/${lang}`;
    return (
        <header className="topbar">
            <a href={`/${lang}`} className="wordmark">Felipe<span>.dev</span></a>
            <nav aria-label={nav.label}>
                <a href={`${base}#projects`}>{nav.projects}</a>
                <a href={`${base}#contact`}>{nav.contact}</a>
            </nav>
            <div className="topbar-tools">
                <LanguagePicker lang={lang} labels={nav} />
            </div>
        </header>
    );
}
