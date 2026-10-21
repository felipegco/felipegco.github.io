import Scene3D from '@/components/scene-3d';
import Topbar from '@/components/ui/Topbar';

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

// Abertura do site: quem eu sou, contado pelas máquinas que passaram pela minha mão
export default function IntroScene({ dict, lang }) {
    const { nav, hero, intro } = dict;
    const [line1, line2] = hero.title.split(', ');
    const last = intro.stops.length - 1;

    const header = <Topbar nav={nav} lang={lang} home />;

    return (
        <Scene3D id="about" world="intro" label={intro.label} hold={4} holdStacked={4} outro={1} header={header} className="intro">
            <article className="scene3d-beat scene3d-hero is-on">
                <h1 className="hero-title">
                    <span className="line">{line1},</span>
                    <span className="line">{line2}</span>
                </h1>
                <p className="hero-sentence">{hero.sentence}</p>
                <div className="hero-actions">
                    <a href="#projects" className="button">{hero.cta}</a>
                    <p className="hero-status">
                        <span>{hero.barLeft}</span>
                        <span>{hero.barRight}</span>
                    </p>
                </div>
                <p className="scene3d-hint">{intro.hint}</p>
            </article>

            {intro.stops.map((stop, i) => (
                <article key={stop.title} className="scene3d-beat">
                    <div className="scene3d-copy">
                        <h2 className="lead">{stop.title}</h2>
                        <p>{stop.mark ? withMark(stop.text, stop.mark) : stop.text}</p>
                        {i === last && (
                            <>
                                <p className="intro-sign">
                                    <strong>Felipe Giacomini Cocco</strong>
                                    <span>{intro.role}</span>
                                </p>
                                <a href="#projects" className="button">{intro.next}</a>
                            </>
                        )}
                    </div>
                </article>
            ))}
        </Scene3D>
    );
}
