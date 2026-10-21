'use client';

import { useEffect, useRef } from 'react';
import { loadMotion } from '@/lib/motion';

const WORLDS = {
    intro: () => import('@/lib/intro-world'),
    request: () => import('@/lib/request-world'),
};

// Uma cena de rolagem: o palco fica preso na tela enquanto a seção passa,
// o mundo 3D segue o progresso e o texto de cada parada aparece quando a cena para nela.
// Sem script, sem WebGL ou com movimento reduzido, as paradas viram uma lista comum.
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
        let lenis = null;
        let disposed = false;
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

        const onStopClick = (e) => {
            const i = stops.indexOf(e.currentTarget);
            if (i < 0) return;
            e.preventDefault();
            const top = section.offsetTop + (i / (beats.length - 1)) * (section.offsetHeight - window.innerHeight);
            if (lenis) lenis.scrollTo(top, { duration: 1.6 });
            else window.scrollTo({ top, behavior: 'smooth' });
        };
        stops.forEach((el) => el.addEventListener('click', onStopClick));

        const onPointer = (e) => {
            if (e.pointerType === 'touch' || !instance) return;
            instance.setPointer(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
        };

        (async () => {
            try {
                const [{ createWorld }, motion] = await Promise.all([WORLDS[world](), loadMotion()]);
                if (disposed) return;

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
            instance?.dispose();
        };
    }, [world, labels]);

    return (
        <section
            id={id}
            className={`scene scene3d ${className}`}
            data-scene={world}
            ref={ref}
            aria-label={label}
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
