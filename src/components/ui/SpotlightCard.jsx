'use client';

import { useRef } from 'react';
import { useTheme } from '@/lib/ThemeContext';

export default function SpotlightCard({ children, className = '' }) {
    const divRef = useRef(null);
    const { theme } = useTheme();

    const handleMouseMove = (e) => {
        if (!divRef.current) return;

        const div = divRef.current;
        const rect = div.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        window.requestAnimationFrame(() => {
            div.style.setProperty('--mouse-x', `${x}px`);
            div.style.setProperty('--mouse-y', `${y}px`);
        });
    };

    const spotlightGradient = theme === 'dark'
        ? 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)'
        : 'radial-gradient(circle, rgba(32, 80, 153, 0.12) 0%, rgba(37, 99, 235, 0.08) 40%, transparent 70%)';

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            className={`
        group relative overflow-hidden rounded-2xl border bg-card p-8 
        transition-all duration-300
        border-card-border hover:border-opacity-30
        ${className}
      `}
            style={{
                borderColor: 'var(--card-border)',
                backgroundColor: 'var(--card-bg)'
            }}
        >
            <div
                className="pointer-events-none absolute rounded-full -translate-x-1/2 -translate-y-1/2 w-0 h-0 group-hover:w-150 group-hover:h-150 transition-[width,height] duration-300 ease-out"
                style={{
                    left: 'var(--mouse-x)',
                    top: 'var(--mouse-y)',
                    background: spotlightGradient,
                }}
            />

            {/* Conteúdo do Card */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}