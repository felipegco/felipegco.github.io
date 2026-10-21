'use client';

import { useMemo } from 'react';

// Calendário acadêmico da FHO: dois semestres por ano, de mar/2024 a dez/2027
const SEMESTER_STARTS = ['2024-03-01', '2024-08-01', '2025-03-01', '2025-08-01', '2026-03-01', '2026-08-01', '2027-03-01', '2027-08-01'];
const TOTAL_SEMS = SEMESTER_STARTS.length;

function useCurrentSemester() {
    return useMemo(() => {
        const now = new Date();
        const started = SEMESTER_STARTS.filter((d) => new Date(d) <= now).length;
        return Math.min(Math.max(started, 1), TOTAL_SEMS);
    }, []);
}

export default function Journey({ dict }) {
    const semester = useCurrentSemester();

    return (
        <section id="journey" className="journey" data-slide aria-labelledby="journey-title">
            <div className="journey-sheet" data-reveal>
                <h2 id="journey-title">{dict.title}</h2>
                <p className="journey-note">{dict.note}</p>

                {dict.groups.map((group) => (
                    <div className="journey-group" key={group.name}>
                        <h3>{group.name}</h3>
                        <ul>
                            {group.items.map((item) => (
                                <li key={item.name}>
                                    <div className="journey-row">
                                        <span>{item.name}</span>
                                        <span>{item.when}</span>
                                    </div>
                                    <p className="journey-desc">
                                        {item.desc.replace('{n}', semester).replace('{total}', TOTAL_SEMS)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                <p className="journey-closing">
                    {dict.closing[0]}<br />{dict.closing[1]}
                </p>
            </div>
        </section>
    );
}
