'use client';

import { useEffect, useRef } from 'react';

export default function Footer({ dict }) {
    const ref = useRef(null);

    // O retrato sobe devagar enquanto o rodapé entra na tela
    useEffect(() => {
        const el = ref.current;
        if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        let frame = 0;
        const update = () => {
            frame = 0;
            const rect = el.getBoundingClientRect();
            const progress = Math.min(Math.max(1 - rect.top / window.innerHeight, 0), 1);
            el.style.setProperty('--py', `${(1 - progress) * 120}px`);
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

    return (
        <footer className="footer" ref={ref}>
            <div className="footer-top">
                <ul>
                    <li><a href="#about">{dict.about}</a></li>
                    <li><a href="#projects">{dict.projects}</a></li>
                    <li><a href="#journey">{dict.journey}</a></li>
                    <li><a href="#contact">{dict.contact}</a></li>
                </ul>
                <ul>
                    <li><a href="mailto:fgiacominicocco@gmail.com">fgiacominicocco@gmail.com</a></li>
                    <li><a href="https://www.linkedin.com/in/felipegcocco/" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
                    <li><a href="https://github.com/felipegco" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                </ul>
            </div>

            <div className="footer-portrait">
                <img src="/images/profile.png" alt="" width="1264" height="1264" loading="lazy" />
            </div>

            <div className="footer-name">
                <p>Felipe Cocco</p>
                <small>
                    &copy; {new Date().getFullYear()} <a href="https://github.com/felipegco/felipegco.github.io" target="_blank" rel="noopener noreferrer">{dict.rights}</a>
                </small>
            </div>
        </footer>
    );
}
