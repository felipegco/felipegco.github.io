'use client';

import { Children, useEffect, useRef } from 'react';
import { loadMotion } from '@/lib/motion';

const WORLDS = {
    intro: () => import('@/lib/intro-world'),
    request: () => import('@/lib/request-world'),
};

// Uma cena de rolagem: o palco fica preso na tela enquanto a seção passa,
// o mundo 3D segue o progresso e o texto de cada parada aparece quando a cena para nela.
// Cada parada tem um ímã leve: perto dela a roda e o trackpad ficam mais pesados
// (amortecimento) e, se a página parar entre dois cards, ela desliza devagar até um deles,
// a favor do gesto. Um gesto forte atravessa; qualquer rolada interrompe o encaixe.
// Sem script, sem WebGL ou com movimento reduzido, as paradas viram uma lista comum.

// Até que distância (em paradas) o freio age
const PULL = 0.3;
// Quanto da rolada sobra bem em cima de uma parada: subir freia menos que descer
const BRAKE_DOWN = 0.8;
const BRAKE_UP = 0.8;
// Quanto é preciso andar a partir de um card para a página seguir até o próximo
const ADVANCE_DOWN = 0.1;
const ADVANCE_UP = 0.1;

// outro: telas depois da última parada em que o palco continua preso
// (a introdução usa uma para a seção de projetos subir por cima dela).
// backdrop: o que aparece atrás do 3D até ele ficar pronto.
export default function Scene3D({ id, world, labels, label, hold, holdStacked, outro = 0, header, backdrop, route, routeLabel, className = '', children }) {
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
        let idle = 0;
        let removeDamper = null;
        const beats = [...section.querySelectorAll('.scene3d-beat')];
        const stops = [...section.querySelectorAll('.scene3d-route a')];

        // Paradas com texto (0 … last) e, depois delas, as telas de saída (até total)
        const last = beats.length - 1;
        const total = last + outro;

        let shown = -2;
        const showBeat = (p) => {
            const s = p * total;
            const near = Math.round(s);
            const next = near <= last && Math.abs(s - near) < 0.32 ? near : -1;
            if (next === shown) return;
            shown = next;
            beats.forEach((el, i) => el.classList.toggle('is-on', i === next));
            stops.forEach((el, i) => {
                if (i === near) el.setAttribute('aria-current', 'step');
                else el.removeAttribute('aria-current');
            });
        };

        // Posição da rolagem de cada parada, e a parada (com fração) de uma posição
        const yAt = (k) => trigger.start + (k / total) * (trigger.end - trigger.start);
        const sAt = (y) => ((y - trigger.start) / (trigger.end - trigger.start)) * total;

        // Encaixe sem trava: a página desliza até a parada, mas qualquer rolada assume o controle
        // As telas de saída (a cortina dos projetos) andam mais devagar: é a troca de capítulo
        const settle = (k, duration = k > last ? 2.5 : 2.0) => {
            clearTimeout(idle);
            motion.glideTo(yAt(k), { duration });
        };

        // Distância (em paradas, com sinal) da posição até a parada mais próxima
        const nearest = (s) => {
            const k = Math.min(Math.max(Math.round(s), 0), total);
            return { k, d: s - k };
        };

        // Freio: perto de uma parada a rolada encolhe; longe dela passa inteira
        const damper = (deltaY) => {
            if (!trigger || motion.state.auto) return 1;
            const s = sAt(lenis.targetScroll);
            if (s < -PULL || s > total + PULL) return 1;
            const d = Math.abs(nearest(s).d);
            if (d >= PULL) return 1;
            const t = d / PULL;
            const floor = deltaY > 0 ? BRAKE_DOWN : BRAKE_UP;
            return floor + (1 - floor) * t * t * (3 - 2 * t);
        };

        // Parou entre dois cards: segue até o próximo se o gesto andou o bastante, senão volta
        const onLenisScroll = ({ scroll, direction }) => {
            if (!trigger) return;
            clearTimeout(idle);
            if (motion.state.auto) return;
            const s = sAt(scroll);
            if (s <= 0 || s >= total) return;
            idle = setTimeout(() => {
                if (motion.state.auto) return;
                const now = sAt(window.scrollY);
                const base = Math.floor(now);
                const frac = now - base;
                if (frac < 0.01 || frac > 0.99) return;
                const forward = direction < 0 ? 1 - frac > ADVANCE_UP : frac > ADVANCE_DOWN;
                settle(direction < 0 ? (forward ? base : base + 1) : (forward ? base + 1 : base));
            }, 220);
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
                        // Na saída, o texto do palco some no ritmo da cortina que sobe por cima
                        if (outro) section.style.setProperty('--outro', Math.min(Math.max(self.progress * total - last, 0), outro) / outro);
                    },
                });
                // A altura muda quando a cena fica viva: os outros gatilhos precisam medir de novo
                motion.ScrollTrigger.refresh();
                instance.setProgress(trigger.progress);
                showBeat(trigger.progress);
                window.addEventListener('pointermove', onPointer, { passive: true });
                if (lenis) {
                    lenis.on('scroll', onLenisScroll);
                    removeDamper = motion.addDamper(damper);
                }
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
            removeDamper?.();
            lenis?.off('scroll', onLenisScroll);
            trigger?.kill();
            instance?.dispose();
        };
    }, [world, labels, outro]);

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
                {backdrop && <div className="scene3d-backdrop">{backdrop}</div>}
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
