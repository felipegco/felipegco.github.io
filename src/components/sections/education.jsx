'use client';

import { useMemo } from 'react';
import { GraduationCap, Award, Shield, Globe } from 'lucide-react';

// ── Calendário acadêmico ──────────────────────────────────────────────────────
const SEMESTERS = [
    { sem: 1, start: new Date('2024-03-01'), end: new Date('2024-07-31') },
    { sem: 2, start: new Date('2024-08-01'), end: new Date('2024-12-31') },
    { sem: 3, start: new Date('2025-03-01'), end: new Date('2025-07-31') },
    { sem: 4, start: new Date('2025-08-01'), end: new Date('2025-12-31') },
    { sem: 5, start: new Date('2026-03-01'), end: new Date('2026-07-31') },
    { sem: 6, start: new Date('2026-08-01'), end: new Date('2026-12-31') },
    { sem: 7, start: new Date('2027-03-01'), end: new Date('2027-07-31') },
    { sem: 8, start: new Date('2027-08-01'), end: new Date('2027-12-31') },
];

const COURSE_START = new Date('2024-03-01');
const COURSE_END   = new Date('2027-12-31');
const TOTAL_SEMS   = 8;

function useCourseProgress() {
    return useMemo(() => {
        const now = new Date();

        // Progresso total do curso (0–100)
        const totalMs      = COURSE_END - COURSE_START;
        const elapsedMs    = Math.min(Math.max(now - COURSE_START, 0), totalMs);
        const totalProgress = parseFloat(((elapsedMs / totalMs) * 100).toFixed(1));

        // Semestre atual
        const current = SEMESTERS.find(s => now >= s.start && now <= s.end);

        let currentSem       = TOTAL_SEMS; // se passou de tudo, está no último
        let daysLeftInSem    = 0;
        let semProgress      = 100;

        if (now < SEMESTERS[0].start) {
            // Antes do início
            currentSem    = 0;
            semProgress   = 0;
            daysLeftInSem = Math.ceil((SEMESTERS[0].start - now) / 86400000);
        } else if (current) {
            currentSem    = current.sem;
            const semMs   = current.end - current.start;
            const semElapsed = now - current.start;
            semProgress   = parseFloat(((semElapsed / semMs) * 100).toFixed(1));
            daysLeftInSem = Math.ceil((current.end - now) / 86400000);
        } else {
            // Entre semestres — achar o próximo
            const next = SEMESTERS.find(s => now < s.start);
            if (next) {
                currentSem    = next.sem - 1; // terminou o anterior
                daysLeftInSem = Math.ceil((next.start - now) / 86400000);
                semProgress   = 100;
            }
        }

        return { totalProgress, currentSem, semProgress, daysLeftInSem };
    }, []);
}

// icones das certificações
const CERT_ICONS = {
    redhat: <Award size={22} className="text-red-400" />,
    cisco:  <Shield size={22} className="text-blue-400" />,
    udemy:  <Globe size={22} className="text-purple-400" />,
};

// Card da Graduação
function DegreeCard({ item, dict }) {
    const { totalProgress, currentSem, daysLeftInSem } = useCourseProgress();

    return (
        <div
            className="relative overflow-hidden rounded-2xl border p-8 transition-all duration-300 hover:border-blue-500/30"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >

            <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-6">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <GraduationCap size={28} className="text-blue-500" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                        <div>
                            <h3 className="text-xl font-extrabold text-text-primary leading-tight">
                                {item.degree}
                            </h3>
                            <p className="mt-0.5 text-sm font-semibold text-blue-500">
                                {item.institution}
                            </p>
                        </div>
                        <span
                            className="shrink-0 rounded-full border px-3 py-1 font-mono text-xs"
                            style={{
                                borderColor: 'var(--card-border)',
                                backgroundColor: 'var(--card-bg-secondary)',
                                color: 'var(--text-tertiary)'
                            }}
                        >
                            {item.period}
                        </span>
                    </div>

                    <p className="text-sm text-text-secondary leading-relaxed mb-6">
                        {item.description}
                    </p>

                    {/* Barra de progresso total */}
                    <div className="mb-3">
                        <div className="mb-2 flex justify-between items-center">
                            <span className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {dict.semesterLabel.replace('{n}', currentSem).replace('{total}', TOTAL_SEMS)}
                            </span>
                            <span className="font-mono text-xs font-bold text-blue-500">
                                {totalProgress}%
                            </span>
                        </div>
                        <div
                            className="h-2 w-full overflow-hidden rounded-full"
                            style={{ backgroundColor: 'var(--card-bg-secondary)' }}
                        >
                            <div
                                className="h-full rounded-full bg-linear-to-r from-blue-600 to-blue-400 transition-all duration-700"
                                style={{ width: `${totalProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Info extra */}
                    <div className="flex flex-wrap gap-4 mt-4">
                        <div
                            className="flex items-center gap-2 rounded-lg border px-3 py-2"
                            style={{
                                borderColor: 'var(--card-border)',
                                backgroundColor: 'var(--card-bg-secondary)'
                            }}
                        >
                            <span className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {dict.currentSemLabel}
                            </span>
                            <span className="font-mono text-xs font-bold text-blue-500">
                                {currentSem}º
                            </span>
                        </div>

                        <div
                            className="flex items-center gap-2 rounded-lg border px-3 py-2"
                            style={{
                                borderColor: 'var(--card-border)',
                                backgroundColor: 'var(--card-bg-secondary)'
                            }}
                        >
                            <span className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {dict.daysLeftLabel}
                            </span>
                            <span className="font-mono text-xs font-bold text-blue-500">
                                {daysLeftInSem}d
                            </span>
                        </div>

                        <div
                            className="flex items-center gap-2 rounded-lg border px-3 py-2"
                            style={{
                                borderColor: 'var(--card-border)',
                                backgroundColor: 'var(--card-bg-secondary)'
                            }}
                        >
                            <span className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {dict.remainingSemsLabel}
                            </span>
                            <span className="font-mono text-xs font-bold text-blue-500">
                                {TOTAL_SEMS - currentSem}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Card de Certificação
function CertCard({ item }) {
    return (
        <div
            className="group flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:border-blue-500/30"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
                    style={{
                        backgroundColor: 'var(--card-bg-secondary)',
                        borderColor: 'var(--card-border)'
                    }}
                >
                    {CERT_ICONS[item.iconKey]}
                </div>
                <span
                    className="rounded-full border px-2.5 py-1 font-mono text-[10px]"
                    style={{
                        borderColor: 'var(--card-border)',
                        backgroundColor: 'var(--card-bg-secondary)',
                        color: 'var(--text-tertiary)'
                    }}
                >
                    {item.year}
                </span>
            </div>

            <h4 className="mb-1 text-sm font-bold text-text-primary leading-snug">{item.name}</h4>
            <p className="mb-4 text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                {item.issuer}
            </p>
            <p className="mt-auto text-xs text-text-secondary leading-relaxed">{item.description}</p>
        </div>
    );
}

export default function Education({ dict }) {
    return (
        <section id="education" className="py-32 bg-background">
            <div className="mx-auto max-w-275 px-8">

                <div className="mb-16 flex items-center gap-4">
                    <h2 className="text-3xl font-extrabold text-text-primary">{dict.title}</h2>
                    <div className="h-px flex-1 bg-linear-to-r from-border to-transparent" />
                </div>

                <div className="mb-8">
                    <DegreeCard item={dict.degree} dict={dict} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {dict.certifications.map((cert, i) => (
                        <CertCard key={i} item={cert} />
                    ))}
                </div>

            </div>
        </section>
    );
}