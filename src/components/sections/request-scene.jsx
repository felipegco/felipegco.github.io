'use client';

import { useEffect, useRef } from 'react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguagePicker from '@/components/ui/LanguagePicker';

// Trechos reais do repositório felipegco/e-move-backend, na ordem da viagem
const CODE = {
    container: {
        file: 'Dockerfile',
        lines: [
            'FROM amazoncorretto:17-alpine',
            'RUN addgroup -S app && adduser -S app -G app',
            'USER app',
            'EXPOSE 8080',
        ],
    },
    controller: {
        file: 'VeiculoController.java',
        lines: [
            '@PutMapping("/{veiculoId}/bateria")',
            'public ResponseEntity<?> atualizarNivelBateria(…) {',
            '    String token = tokenService.resolveToken(request);',
            '    if (token == null)',
            '        return ResponseEntity.status(401).body(…);',
        ],
    },
    service: {
        file: 'VeiculoService.java',
        lines: [
            'if (nivelBateria < 0 || nivelBateria > 100) {',
            '    throw new IllegalArgumentException(…);',
            '}',
            'double autonomiaEstimada =',
            '    veiculo.getAutonomia() * (nivelBateria / 100.0);',
        ],
    },
    database: {
        file: 'VeiculoService.java',
        lines: [
            '@Service',
            '@Transactional',
            'public class VeiculoService { … }',
            '',
            'associacao.setNivelBateria(nivelBateria);',
            'usuarioVeiculoRepository.save(associacao);',
        ],
    },
    response: {
        file: 'HTTP/1.1 200 OK',
        lines: [
            '{',
            '  "id": 1, "marca": "Tesla", "modelo": "Model 3",',
            '  "nivelBateria": 80, "autonomiaTotal": 491,',
            '  "autonomiaEstimada": 392.8',
            '}',
        ],
    },
};

const TOKEN = /("[^"]*")|(@\w+)|\b(\d+(?:\.\d+)?)\b|\b(FROM|RUN|USER|EXPOSE|public|class|if|return|throw|new|double|String|null)\b/g;

function highlight(line) {
    const parts = [];
    let last = 0;
    for (const m of line.matchAll(TOKEN)) {
        if (m.index > last) parts.push(line.slice(last, m.index));
        const cls = m[1] ? 's' : m[3] ? 'n' : 'k';
        parts.push(<span key={m.index} className={cls}>{m[0]}</span>);
        last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return parts;
}

function Code({ id }) {
    const { file, lines } = CODE[id];
    return (
        <pre className="code-block"><code>
            <span className="code-title">{file}</span>
            {lines.map((line, i) => <span key={i}>{highlight(line)}{'\n'}</span>)}
        </code></pre>
    );
}

export default function RequestScene({ dict, lang }) {
    const { nav, hero, request } = dict;
    const [line1, line2] = hero.title.split(', ');
    const ref = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const section = ref.current;
        const canvas = canvasRef.current;
        if (!section || !canvas) return;

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced) {
            section.classList.add('is-rest');
            return;
        }

        let world = null;
        let trigger = null;
        let lenis = null;
        let raf = null;
        let gsapRef = null;
        let disposed = false;
        const beats = [...section.querySelectorAll('.request-beat')];
        const stops = [...section.querySelectorAll('.request-route a')];

        // Mostra o texto da parada mais próxima só enquanto a cena está parada nela
        let shown = -2;
        const showBeat = (p) => {
            const s = p * (beats.length - 1);
            const near = Math.round(s);
            const next = Math.abs(s - near) < 0.32 ? near : -1;
            if (next === shown) return;
            shown = next;
            section.dataset.beat = String(next);
            beats.forEach((el, i) => el.classList.toggle('is-on', i === next));
            stops.forEach((el, i) => {
                if (i === near) el.setAttribute('aria-current', 'step');
                else el.removeAttribute('aria-current');
            });
        };

        const scrollToBeat = (i) => {
            const top = section.offsetTop + (i / (beats.length - 1)) * (section.offsetHeight - window.innerHeight);
            if (lenis) lenis.scrollTo(top, { duration: 1.6 });
            else window.scrollTo({ top, behavior: 'smooth' });
        };
        const onStopClick = (e) => {
            const i = stops.indexOf(e.currentTarget);
            if (i < 0) return;
            e.preventDefault();
            scrollToBeat(i);
        };
        stops.forEach((el) => el.addEventListener('click', onStopClick));

        const onPointer = (e) => {
            if (e.pointerType === 'touch' || !world) return;
            world.setPointer(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
        };

        (async () => {
            try {
                const [{ createWorld }, { gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
                    import('@/lib/request-world'),
                    import('gsap'),
                    import('gsap/ScrollTrigger'),
                    import('lenis'),
                ]);
                if (disposed) return;

                world = createWorld(canvas, {
                    labels: request.screen,
                    onReady: () => section.classList.add('is-ready'),
                });
                if (!world) throw new Error('WebGL indisponível');

                gsap.registerPlugin(ScrollTrigger);
                gsapRef = gsap;
                section.classList.add('is-live');

                // Rolagem com peso no mouse e no trackpad; o toque continua nativo
                if (!window.matchMedia('(pointer: coarse)').matches) {
                    lenis = new Lenis({ lerp: 0.12, smoothWheel: true, anchors: true, autoRaf: false });
                    lenis.on('scroll', ScrollTrigger.update);
                    raf = (t) => lenis.raf(t * 1000);
                    gsap.ticker.add(raf);
                    gsap.ticker.lagSmoothing(0);
                }

                trigger = ScrollTrigger.create({
                    trigger: section,
                    start: 'top top',
                    end: 'bottom bottom',
                    onUpdate: (self) => {
                        world.setProgress(self.progress);
                        showBeat(self.progress);
                    },
                });
                world.setProgress(trigger.progress);
                showBeat(trigger.progress);
                window.addEventListener('pointermove', onPointer, { passive: true });
            } catch {
                section.classList.remove('is-live');
                section.classList.add('is-rest');
            }
        })();

        return () => {
            disposed = true;
            stops.forEach((el) => el.removeEventListener('click', onStopClick));
            window.removeEventListener('pointermove', onPointer);
            trigger?.kill();
            if (raf) gsapRef?.ticker.remove(raf);
            lenis?.destroy();
            world?.dispose();
        };
    }, [request.screen]);

    const steps = request.stops;

    return (
        <section className="scene request" data-scene="request" ref={ref} aria-label={request.label}>
            <div className="request-stage">
                <canvas className="request-canvas" ref={canvasRef} aria-hidden="true" />

                <header className="topbar">
                    <a href={`/${lang}`} className="wordmark">Felipe<span>.dev</span></a>
                    <nav aria-label={nav.label}>
                        <a href="#about">{nav.about}</a>
                        <a href="#projects">{nav.projects}</a>
                        <a href="#contact">{nav.contact}</a>
                    </nav>
                    <div className="topbar-tools">
                        <ThemeToggle labels={nav} />
                        <LanguagePicker lang={lang} labels={nav} />
                    </div>
                </header>

                <div className="request-beats">
                    <article className="request-beat request-hero is-on" id={`stop-${steps[0].id}`}>
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
                        <p className="request-hint">{request.hint}</p>
                    </article>

                    {steps.slice(1).map((step) => (
                        <article key={step.id} className="request-beat" id={`stop-${step.id}`}>
                            <div className="request-copy">
                                <h2 className="lead">{step.title}</h2>
                                <p>{step.text}</p>
                                {step.link && <a href="#console" className="button">{step.link}</a>}
                            </div>
                            <Code id={step.id} />
                        </article>
                    ))}
                </div>

                <nav className="request-route" aria-label={request.route}>
                    <ol>
                        {steps.map((step, i) => (
                            <li key={step.id}>
                                <a href={`#stop-${step.id}`} aria-current={i === 0 ? 'step' : undefined}>{step.name}</a>
                            </li>
                        ))}
                    </ol>
                </nav>
            </div>
        </section>
    );
}
