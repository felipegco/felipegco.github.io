'use client';

import { useRef } from 'react';

export default function SpotlightCard({ children, className = '' }) {
    const divRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!divRef.current) return;

        const div = divRef.current;
        const rect = div.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Usamos requestAnimationFrame para uma performance mais fluida
        window.requestAnimationFrame(() => {
            div.style.setProperty('--mouse-x', `${x}px`);
            div.style.setProperty('--mouse-y', `${y}px`);
        });
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            className={`
        group relative overflow-hidden rounded-2xl border border-neutral-800 bg-[#171717] p-8 
        transition-colors hover:border-white/15 
        ${className}
      `}
        >
            <div
                className="pointer-events-none absolute rounded-full -translate-x-1/2 -translate-y-1/2 w-0 h-0 group-hover:w-150 group-hover:h-150 transition-[width,height] duration-300 ease-out"
                style={{
                    left: 'var(--mouse-x)',
                    top: 'var(--mouse-y)',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                }}
            />

            {/* Conteúdo do Card */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}