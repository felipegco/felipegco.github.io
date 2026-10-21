import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguagePicker from '@/components/ui/LanguagePicker';
import HeroStage from '@/components/sections/hero-stage';

function withMark(text, mark) {
    const at = text.indexOf(mark);
    if (at === -1) return text;
    return (
        <>
            {text.slice(0, at)}
            <mark>{mark}</mark>
            {text.slice(at + mark.length)}
        </>
    );
}

export default function Hero({ dict, lang }) {
    const { nav, hero, about } = dict;
    const [line1, line2] = hero.title.split(', ');

    return (
        <div className="split">
            <div>
                <header className="sheet">
                    <nav className="sheet-nav" aria-label="Principal">
                        <a href="#projects">{nav.projects}</a>
                        <a href={`/${lang}`} className="wordmark">Felipe<span>.dev</span></a>
                        <a href="#contact">{nav.contact}</a>
                    </nav>

                    <div className="hero-copy">
                        <h1 className="hero-title">
                            <span className="line">{line1},</span>
                            <span className="line">{line2}</span>
                        </h1>
                        <p className="hero-sentence">{hero.sentence}</p>
                        <a href="#projects" className="button">{hero.cta}</a>
                    </div>
                    <div className="sheet-tools">
                        <ThemeToggle labels={nav} />
                        <LanguagePicker lang={lang} labels={nav} />
                    </div>
                </header>

                <section id="about" className="letter" aria-labelledby="about-title">
                    <div className="letter-head" data-reveal>
                        <img src="/images/profile.png" alt="" width="56" height="56" loading="lazy" />
                        <h2 id="about-title" className="lead">{about.title}</h2>
                    </div>
                    {about.paragraphs.map((p, i) => (
                        <p key={i} data-reveal style={{ '--i': i + 1 }}>{withMark(p, about.mark)}</p>
                    ))}
                    <div className="letter-sign" data-reveal style={{ '--i': 5 }}>
                        <strong>Felipe Giacomini Cocco</strong>
                        <span>{about.role}</span>
                    </div>
                </section>
            </div>

            <HeroStage alt={hero.portraitAlt} barLeft={hero.barLeft} barRight={hero.barRight} />
        </div>
    );
}
