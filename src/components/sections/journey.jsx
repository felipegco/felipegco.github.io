'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { loadMotion } from '@/lib/motion';

// Calendário acadêmico da FHO: dois semestres por ano, de mar/2024 a dez/2027
const SEMESTER_STARTS = ['2024-03-01', '2024-08-01', '2025-03-01', '2025-08-01', '2026-03-01', '2026-08-01', '2027-03-01', '2027-08-01'];
const TOTAL_SEMS = SEMESTER_STARTS.length;

// O primeiro emprego em TI (Marino): o "tempo em TI" do cupom conta daqui
const IT_SINCE = new Date('2024-03-01');

// Espaço em branco que sai junto com cada bloco, entre a última linha e a fenda
const MARGIN = 32;

// O código de barras do cupom baixa o currículo (public/resume.pdf)
const RESUME = '/resume.pdf';

function useCurrentSemester() {
    return useMemo(() => {
        const now = new Date();
        const started = SEMESTER_STARTS.filter((d) => new Date(d) <= now).length;
        return Math.min(Math.max(started, 1), TOTAL_SEMS);
    }, []);
}

function useTimeInIT({ year, month, and }) {
    return useMemo(() => {
        const now = new Date();
        const months = (now.getFullYear() - IT_SINCE.getFullYear()) * 12 + now.getMonth() - IT_SINCE.getMonth();
        const y = Math.floor(months / 12);
        const m = months % 12;
        const parts = [];
        if (y) parts.push(`${y} ${year[y === 1 ? 0 : 1]}`);
        if (m || !y) parts.push(`${m} ${month[m === 1 ? 0 : 1]}`);
        return parts.join(and ? ` ${and} ` : ' ');
    }, [year, month, and]);
}

// Barras com larguras fixas, geradas a partir do texto: o mesmo desenho em todo carregamento
function Barcode({ seed }) {
    const bars = [];
    let x = 0;
    for (let i = 0; i < 46; i++) {
        const code = seed.charCodeAt(i % seed.length) + i * 7;
        const w = 1 + (code % 3);
        if (i % 2 === 0) bars.push(<rect key={i} x={x} y="0" width={w} height="56" />);
        x += w + (code % 2) + 1;
    }
    return (
        <svg className="journey-barcode" viewBox={`0 0 ${x} 56`} preserveAspectRatio="none" aria-hidden="true">
            {bars}
        </svg>
    );
}

function Line({ label, value }) {
    return (
        <p className="journey-line">
            <span>{label}</span>
            {label && <span className="journey-dots" aria-hidden="true" />}
            <span>{value}</span>
        </p>
    );
}

// Trajetória: um cupom que sobe de uma impressora no pé da tela conforme a página desce.
// Cada parada do paginador imprime um bloco: experiência, formação e cursos, o total.
// O cabeçalho sai primeiro; o bloco novo aparece logo acima da fenda e os anteriores sobem. Se um bloco não couber na tela (celular, janela baixa),
// sem script ou com movimento reduzido, o cupom fica inteiro e parado, como antes.
export default function Journey({ dict }) {
    const semester = useCurrentSemester();
    const timeInIT = useTimeInIT(dict.total);
    const sectionRef = useRef(null);
    const feedRef = useRef(null);
    const sheetRef = useRef(null);
    const [printing, setPrinting] = useState(false);

    useEffect(() => {
        const section = sectionRef.current;
        const feed = feedRef.current;
        const sheet = sheetRef.current;
        if (!section || !feed || !sheet) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const blocks = [...sheet.querySelectorAll('[data-print]')];
        let trigger = null;
        let removeStops = null;
        let disposed = false;
        let ends = [];
        let progress = 0;

        // Onde termina cada bloco no papel, com um respiro para a última linha não parar
        // atrás da impressora; o último bloco leva o papel inteiro
        const measure = () => {
            ends = blocks.map((b, i) => (i === blocks.length - 1 ? sheet.offsetHeight : b.offsetTop + b.offsetHeight + MARGIN));
        };

        // 0 → 1: a seção sobe e imprime o primeiro bloco; 1 → 2 → 3: um bloco por parada
        const apply = () => {
            const s = progress * blocks.length;
            const k = Math.min(Math.floor(s), blocks.length - 1);
            const from = k === 0 ? 0 : ends[k - 1];
            const printed = from + (ends[k] - from) * (s - k);
            sheet.style.transform = `translateY(${feed.clientHeight - printed}px)`;
        };

        // Cada trecho impresso de uma vez precisa caber entre o topo da tela e a fenda
        const fits = () => {
            const room = feed.clientHeight;
            return ends.every((end, i) => end - (i === 0 ? 0 : ends[i - 1]) <= room);
        };

        let motion = null;

        // Volta para o cupom parado (a janela ficou baixa demais para um bloco)
        const flatten = () => {
            trigger?.kill();
            trigger = null;
            removeStops?.();
            removeStops = null;
            sheet.style.transform = '';
            section.classList.remove('is-printing');
            motion.ScrollTrigger.refresh();
        };

        // A janela mudou: se um bloco não cabe mais, o cupom para
        const resize = new ResizeObserver(() => {
            if (!trigger) return;
            measure();
            if (!fits()) flatten();
            else apply();
        });

        // O papel mudou (um "ver detalhes" abriu): só reposiciona, sem desligar a impressão
        const grow = new ResizeObserver(() => {
            if (!trigger) return;
            measure();
            apply();
        });

        // A decisão espera as fontes: com a fonte final o texto ocupa mais espaço
        Promise.all([loadMotion(), document.fonts.ready]).then(([loaded]) => {
            if (disposed) return;
            motion = loaded;
            section.classList.add('is-printing');
            measure();
            if (!fits()) {
                section.classList.remove('is-printing');
                return;
            }
            setPrinting(true);
            motion.ScrollTrigger.refresh();
            trigger = motion.ScrollTrigger.create({
                trigger: section,
                start: 'top bottom',
                end: 'bottom bottom',
                onUpdate: (self) => {
                    progress = self.progress;
                    apply();
                },
            });
            progress = trigger.progress;
            apply();
            resize.observe(feed);
            grow.observe(sheet);
            // As paradas: a seção no topo e uma tela a mais para cada bloco seguinte
            removeStops = motion.addStops(() => blocks.map((_, k) => trigger.start + (k + 1) * window.innerHeight));
        });

        return () => {
            disposed = true;
            resize.disconnect();
            grow.disconnect();
            removeStops?.();
            trigger?.kill();
        };
    }, []);

    const [experience, education, courses] = dict.groups;

    const group = (g) => (
        <div className="journey-group" key={g.name}>
            <h3>{g.name}</h3>
            <ul>
                {g.items.map((item) => (
                    <li key={item.name}>
                        <div className="journey-row">
                            <span>{item.name}</span>
                            <span>{item.when}</span>
                        </div>
                        <p className="journey-desc">
                            {item.desc.replace('{n}', semester).replace('{total}', TOTAL_SEMS)}
                        </p>
                        {item.tools && <p className="journey-tools">{item.tools}</p>}
                        {item.details && (
                            <details className="journey-details">
                                <summary>{dict.more}</summary>
                                <ul>
                                    {item.details.map((d) => <li key={d}>{d}</li>)}
                                </ul>
                            </details>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <section id="journey" className="journey" ref={sectionRef} aria-labelledby="journey-title" data-slide>
            <div className="journey-stage">
                <div className="journey-feed" ref={feedRef}>
                    <div className="journey-sheet" ref={sheetRef} data-reveal={printing ? undefined : ''}>
                        <div data-print>
                            <h2 id="journey-title">{dict.title}</h2>
                            <p className="journey-note">{dict.note}</p>
                            {group(experience)}
                        </div>

                        <div data-print>
                            {group(education)}
                            {group(courses)}
                        </div>

                        <div data-print className="journey-total">
                            <h3>{dict.total.title}</h3>
                            <Line label={dict.total.time} value={timeInIT} />
                            <Line
                                label={dict.total.semester}
                                value={(
                                    <>
                                        {semester}/{TOTAL_SEMS}{' '}
                                        <span className="journey-meter" style={{ '--done': semester / TOTAL_SEMS }} aria-hidden="true" />
                                    </>
                                )}
                            />
                            {dict.total.studyingValue.map((value, i) => (
                                <Line key={value} label={i === 0 ? dict.total.studying : ''} value={value} />
                            ))}
                            <a href={RESUME} className="journey-download" download>
                                <Barcode seed="felipegco" />
                                <span>{dict.total.download}</span>
                            </a>
                        </div>
                    </div>
                </div>
                <div className="journey-printer" aria-hidden="true">
                    <span className="journey-slot" />
                    <span className="journey-led" />
                </div>
            </div>
        </section>
    );
}
