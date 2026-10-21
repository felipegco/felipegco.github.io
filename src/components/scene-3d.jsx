'use client';

import { Children, useEffect, useRef } from 'react';
import { loadMotion } from '@/lib/motion';

const WORLDS = {
    intro: () => import('@/lib/intro-world'),
    request: () => import('@/lib/request-world'),
};

// Uma cena de rolagem: o palco fica preso na tela enquanto a seção passa,
// o mundo 3D segue o progresso e o texto de cada parada aparece quando a cena para nela.
// Cada parada é um ímã: no mouse e no trackpad a página desliza até ela e segura um instante;
// no toque, pontos de encaixe nativos (scroll-snap-stop) fazem o mesmo.
// Sem script, sem WebGL ou com movimento reduzido, as paradas viram uma lista comum.

// Quanto a página fica parada numa parada antes de aceitar a próxima rolada
const HOLD_MS = 420;
export default function Scene3D({ id, world, labels, label, hold, holdStacked, header, route, routeLabel, className = '', children }) {
    const ref = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const section = ref.current;
        const canvas = canvasRef.current;
        if (!section || !canvas) return;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            section.classList.add('is-rest');
            return;
        }

        let instance = null;
        let trigger = null;
        let motion = null;
        let lenis = null;
        let disposed = false;
        let lastS = null;
        let idle = 0;
        let release = 0;
        const beats = [...section.querySelectorAll('.scene3d-beat')];
        const stops = [...section.querySelectorAll('.scene3d-route a')];

        let shown = -2;
        const showBeat = (p) => {
            const s = p * (beats.length - 1);
            const near = Math.round(s);
            const next = Math.abs(s - near) < 0.32 ? near : -1;
            if (next === shown) return;
            shown = next;
            beats.forEach((el, i) => el.classList.toggle('is-on', i === next));
            stops.forEach((el, i) => {
                if (i === near) el.setAttribute('aria-current', 'step');
                else el.removeAttribute('aria-current');
            });
        };

        // Posição da rolagem de cada parada, e a parada (com fração) de uma posição
        const last = beats.length - 1;
        const yAt = (k) => trigger.start + (k / last) * (trigger.end - trigger.start);
        const sAt = (y) => ((y - trigger.start) / (trigger.end - trigger.start)) * last;

        // Desliza até a parada e segura: durante o deslize e logo depois, a roda não mexe a página,
        // então a inércia do trackpad não atravessa o card
        const settle = (k, duration = 0.85) => settleAt(yAt(k), duration);
        const settleAt = (y, duration) => {
            clearTimeout(idle);
            motion.glideTo(y, {
                duration,
                lock: true,
                onComplete: () => {
                    lastS = sAt(window.scrollY);
                    if (!lenis) return;
                    lenis.stop();
                    clearTimeout(release);
                    release = setTimeout(() => lenis.start(), HOLD_MS);
                },
            });
        };

        const onLenisScroll = ({ scroll, direction }) => {
            if (!trigger) return;
            const s = sAt(scroll);
            clearTimeout(idle);
            if (motion.state.auto || lenis.isStopped) {
                lastS = s;
                return;
            }
            // Passou por uma parada rolando a roda ou o trackpad (mesmo num movimento rápido): volta e para nela.
            // Arrastar a barra de rolagem ou usar Home/End é rolagem nativa e não é segurado.
            if (lastS !== null && direction && lenis.isScrolling === 'smooth') {
                const k = direction > 0 ? Math.ceil(lastS + 0.001) : Math.floor(lastS - 0.001);
                const crossed = direction > 0 ? s >= k : s <= k;
                if (k >= 0 && k <= last && crossed) {
                    lastS = s;
                    settle(k);
                    return;
                }
            }
            lastS = s;
            // Parou na tela de entrada da cena (a anterior saindo, esta chegando):
            // termina de entrar ou volta uma tela, a favor do movimento
            const entry = yAt(0) - window.innerHeight;
            if (scroll > entry && scroll < yAt(0) && entry > 0) {
                idle = setTimeout(() => {
                    if (motion.state.auto) return;
                    const frac = (scroll - entry) / window.innerHeight;
                    const forward = direction > 0 ? frac > 0.12 : frac > 0.88;
                    settleAt(forward ? yAt(0) : entry, 0.85);
                }, 180);
            }
            // Parou entre duas paradas: encaixa na mais próxima, a favor do movimento
            if (s > 0 && s < last) {
                idle = setTimeout(() => {
                    if (motion.state.auto) return;
                    const base = Math.floor(s);
                    const frac = s - base;
                    if (frac < 0.01 || frac > 0.99) return;
                    const forward = direction > 0 ? frac > 0.12 : frac > 0.88;
                    settle(forward ? base + 1 : base);
                }, 180);
            }
        };

        const onStopClick = (e) => {
            const i = stops.indexOf(e.currentTarget);
            if (i < 0 || !trigger) return;
            e.preventDefault();
            settle(i, 1.4);
        };
        stops.forEach((el) => el.addEventListener('click', onStopClick));

        const onPointer = (e) => {
            if (e.pointerType === 'touch' || !instance) return;
            instance.setPointer(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
        };

        (async () => {
            try {
                const [{ createWorld }, loaded] = await Promise.all([WORLDS[world](), loadMotion()]);
                if (disposed) return;
                motion = loaded;

                instance = createWorld(canvas, {
                    labels,
                    onReady: () => section.classList.add('is-ready'),
                });
                if (!instance) throw new Error('WebGL indisponível');

                lenis = motion.lenis;
                section.classList.add('is-live');
                trigger = motion.ScrollTrigger.create({
                    trigger: section,
                    start: 'top top',
                    end: 'bottom bottom',
                    onUpdate: (self) => {
                        instance.setProgress(self.progress);
                        showBeat(self.progress);
                    },
                });
                // A altura muda quando a cena fica viva: os outros gatilhos precisam medir de novo
                motion.ScrollTrigger.refresh();
                instance.setProgress(trigger.progress);
                showBeat(trigger.progress);
                window.addEventListener('pointermove', onPointer, { passive: true });
                lastS = sAt(window.scrollY);
                lenis?.on('scroll', onLenisScroll);
            } catch {
                section.classList.remove('is-live');
                section.classList.add('is-rest');
            }
        })();

        return () => {
            disposed = true;
            stops.forEach((el) => el.removeEventListener('click', onStopClick));
            window.removeEventListener('pointermove', onPointer);
            clearTimeout(idle);
            clearTimeout(release);
            lenis?.off('scroll', onLenisScroll);
            trigger?.kill();
            instance?.dispose();
        };
    }, [world, labels]);

    const count = Children.count(children);

    return (
        <section
            id={id}
            className={`scene scene3d ${className}`}
            data-scene={world}
            ref={ref}
            aria-label={label}
            style={{ '--hold': hold, '--hold-stacked': holdStacked ?? hold, '--beats': count }}
        >
            <div className="scene3d-snaps" aria-hidden="true">
                {Array.from({ length: count }, (_, k) => <span key={k} style={{ '--k': k }} />)}
            </div>
            <div className="scene3d-stage">
                <canvas className="scene3d-canvas" ref={canvasRef} aria-hidden="true" />
                {header}
                <div className="scene3d-beats">{children}</div>
                {route && (
                    <nav className="scene3d-route" aria-label={routeLabel}>
                        <ol>
                            {route.map((stop, i) => (
                                <li key={stop.id}>
                                    <a href={`#stop-${stop.id}`} aria-current={i === 0 ? 'step' : undefined}>{stop.name}</a>
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}
            </div>
        </section>
    );
}
