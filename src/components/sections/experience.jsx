'use client';

import { useState } from 'react';

export default function ExperienceSection({ dict }) {
    const experiences = dict.items;
    const [active, setActive] = useState(0);

    const item = experiences[active];

    return (
        <section id="experience" className="py-32 bg-background">
            <div className="mx-auto max-w-275 px-8">

                {/* Cabeçalho */}
                <div className="mb-16 flex items-center gap-4">
                    <h2 className="text-3xl font-extrabold text-text-primary">{dict.title}</h2>
                    <div className="h-px flex-1 bg-linear-to-r from-border to-transparent" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 items-start">

                    {/* ── TIMELINE (esquerda, 2/5) ── */}
                    <div className="md:col-span-2 flex flex-col gap-0">
                        {experiences.map((exp, index) => {
                            const isActive = index === active;
                            const isLast = index === experiences.length - 1;

                            return (
                                <div key={index} className="relative flex gap-5 cursor-pointer group" onClick={() => setActive(index)}>

                                    {/* Linha + ponto */}
                                    <div className="flex flex-col items-center">
                                        <div
                                            className="relative z-10 mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300"
                                            style={{
                                                borderColor: isActive ? 'var(--azul-light)' : 'var(--card-border)',
                                                backgroundColor: isActive ? 'rgba(59,130,246,0.15)' : 'var(--background)',
                                                boxShadow: isActive ? '0 0 12px rgba(59,130,246,0.4)' : 'none',
                                            }}
                                        >
                                            <div
                                                className="h-1.5 w-1.5 rounded-full transition-all duration-300"
                                                style={{ backgroundColor: isActive ? '#3b82f6' : 'var(--text-tertiary)' }}
                                            />
                                        </div>
                                        {!isLast && (
                                            <div
                                                className="w-px flex-1 min-h-10 transition-colors duration-300"
                                                style={{ backgroundColor: isActive ? 'rgba(59,130,246,0.3)' : 'var(--card-border)' }}
                                            />
                                        )}
                                    </div>

                                    {/* Texto resumido */}
                                    <div className="pb-8 flex-1 min-w-0">
                                        <p
                                            className="text-sm font-semibold leading-tight transition-colors duration-200"
                                            style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                                        >
                                            {exp.role}
                                        </p>
                                        <p
                                            className="mt-0.5 text-xs font-mono transition-colors duration-200 truncate"
                                            style={{ color: isActive ? '#3b82f6' : 'var(--text-tertiary)' }}
                                        >
                                            {exp.company}
                                        </p>
                                        <p
                                            className="mt-1 text-xs font-mono transition-colors duration-200"
                                            style={{ color: 'var(--text-tertiary)' }}
                                        >
                                            {exp.period}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div
                        className="md:col-span-3 rounded-2xl border p-8 transition-all duration-300"
                        style={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'var(--card-border)',
                        }}
                    >
                        {/* Badge de período */}
                        <span
                            className="inline-block rounded-full border px-3 py-1 font-mono text-xs mb-6"
                            style={{
                                borderColor: 'var(--card-border)',
                                backgroundColor: 'var(--card-bg-secondary)',
                                color: 'var(--text-tertiary)'
                            }}
                        >
                            {item.period}
                        </span>

                        {/* Título */}
                        <h3 className="text-2xl font-extrabold text-text-primary leading-tight">
                            {item.role}
                        </h3>
                        <p className="mt-1 mb-6 text-sm font-semibold text-blue-500">
                            {item.company}
                        </p>

                        {/* Divisor */}
                        <div className="mb-6 h-px" style={{ backgroundColor: 'var(--card-border)' }} />

                        <ul className="space-y-3 mb-8">
                            {item.bullets.map((bullet, i) => (
                                <li key={i} className="flex gap-3 text-sm text-text-secondary leading-relaxed">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500/60" />
                                    {bullet}
                                </li>
                            ))}
                        </ul>

                        {item.techs && (
                            <div className="flex flex-wrap gap-2">
                                {item.techs.map((tech) => (
                                    <span
                                        key={tech}
                                        className="rounded-md border px-3 py-1.5 font-mono text-xs transition-all duration-200 hover:border-blue-500 hover:text-blue-500 cursor-default"
                                        style={{
                                            backgroundColor: 'var(--card-bg-secondary)',
                                            borderColor: 'var(--card-border)',
                                            color: 'var(--text-secondary)'
                                        }}
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </section>
    );
}