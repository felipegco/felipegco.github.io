'use client';

import { useEffect, useRef } from 'react';

// O palco azul gira em 3D com a rolagem e segue o ponteiro;
// retrato e barra ficam em camadas de profundidade diferentes.
export default function HeroStage({ alt, barLeft, barRight }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        let frame = 0;
        const update = () => {
            frame = 0;
            const split = el.parentElement.getBoundingClientRect();
            const progress = Math.min(Math.max(-split.top / Math.max(split.height - window.innerHeight, 1), 0), 1);
            el.style.setProperty('--sy', `${progress * -14}deg`);
            el.style.setProperty('--sx', `${progress * 6}deg`);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(frame);
        };
    }, []);

    const handleMove = (e) => {
        const el = ref.current;
        if (!el || e.pointerType === 'touch') return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty('--ry', `${x * 10}deg`);
        el.style.setProperty('--rx', `${y * -8}deg`);
    };

    const handleLeave = () => {
        ref.current?.style.setProperty('--ry', '0deg');
        ref.current?.style.setProperty('--rx', '0deg');
    };

    return (
        <aside className="stage" ref={ref} onPointerMove={handleMove} onPointerLeave={handleLeave}>
            <div className="stage-rig">
                <div className="stage-portrait">
                    <img src="/images/profile.png" alt={alt} width="1264" height="1264" fetchPriority="high" />
                </div>
                <p className="stage-bar">
                    <span><i className="dot" aria-hidden="true" />{barLeft}</span>
                    <span>{barRight}</span>
                </p>
            </div>
        </aside>
    );
}
