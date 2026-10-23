'use client';

import { useEffect, useRef } from 'react';
import { loadMotion } from '@/lib/motion';

const WORLDS = {
    intro: () => import('@/lib/intro-world'),
    request: () => import('@/lib/request-world'),
};

// Uma cena de rolagem: o palco fica preso na tela enquanto a seção passa,
// o mundo 3D segue o progresso e o texto de cada parada aparece quando a cena para nela.
// Cada parada é um slide: a página anda de uma em uma (o paginador fica em motion.js).
// Sem script, sem WebGL ou com movimento reduzido, as paradas viram uma lista comum.

// outro: telas depois da última parada em que o palco continua preso
// (a introdução usa uma para a seção de projetos subir por cima dela).
export default function Scene3D({ id, world, labels, label, hold, holdStacked, outro = 0, header, route, routeLabel, className = '', children }) {
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
        let disposed = false;
        let removeStops = null;
        const beats = [...section.querySelectorAll('.scene3d-beat')];
        const stops = [...section.querySelectorAll('.scene3d-route a')];

        // Paradas com texto (0 … last) e, depois delas, as telas de saída (até total)
        const last = beats.length - 1;
        const total = last + outro;

        let shown = -2;
        const showBeat = (p) => {
            const s = p * total;
            const near = Math.round(s);
            const next = near <= last && Math.abs(s - near) < 0.12 ? near : -1;
            if (next === shown) return;
            shown = next;
            beats.forEach((el, i) => el.classList.toggle('is-on', i === next));
            stops.forEach((el, i) => {
                if (i === near) el.setAttribute('aria-current', 'step');
                else el.removeAttribute('aria-current');
            });
        };

        // Posição da rolagem de cada parada
        const yAt = (k) => trigger.start + (k / total) * (trigger.end - trigger.start);

        const onStopClick = (e) => {
            const i = stops.indexOf(e.currentTarget);
            if (i < 0 || !trigger) return;
            e.preventDefault();
            motion.glideTo(yAt(i), { duration: 1.8 });
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
                motion.followHash();
                instance.setProgress(trigger.progress);
                showBeat(trigger.progress);
                window.addEventListener('pointermove', onPointer, { passive: true });
                removeStops = motion.addStops(() => Array.from({ length: total + 1 }, (_, k) => yAt(k)));
            } catch {
                section.classList.remove('is-live');
                section.classList.add('is-rest');
                motion?.followHash();
            }
        })();

        return () => {
            disposed = true;
            stops.forEach((el) => el.removeEventListener('click', onStopClick));
            window.removeEventListener('pointermove', onPointer);
            removeStops?.();
            trigger?.kill();
            instance?.dispose();
        };
    }, [world, labels, outro]);

    return (
        <section
            id={id}
            className={`scene scene3d ${className}`}
            data-scene={world}
            ref={ref}
            aria-label={label}
            data-slide
            style={{ '--hold': hold, '--hold-stacked': holdStacked ?? hold }}
        >
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
