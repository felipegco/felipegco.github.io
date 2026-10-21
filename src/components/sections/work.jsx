'use client';

import { useEffect, useRef, useState } from 'react';

// Projetos que já têm página própria, com a cena 3D
const PAGES = { emove: 'e-move' };

const IMAGES = {
    greentech: '/images/work/greentech.jpg',
    clinicare: '/images/work/clinicare.jpg',
    mesas: '/images/work/mesas.jpg',
};

function ProjectMedia({ project, dict, lazy = true }) {
    if (project.id === 'emove') {
        return (
            <video
                src="/media/emove-scroll.webm"
                poster="/images/work/emove.jpg"
                muted
                loop
                autoPlay
                playsInline
                preload="none"
                aria-label={project.alt}
            />
        );
    }

    if (project.id === 'atoll') {
        return (
            <div className="media-logo">
                <img src="/images/work/atoll.png" alt={project.alt} width="512" height="512" loading="lazy" />
            </div>
        );
    }

    if (project.id === 'triagem') {
        return (
            <div className="ui-chat" data-ui role="img" aria-label={project.alt}>
                {dict.triage.map((row) => (
                    <div className="ui-chat-row" key={row.msg}>
                        <span className="ui-chat-msg">{row.msg}</span>
                        <span className="ui-chat-tag">{row.label}</span>
                    </div>
                ))}
            </div>
        );
    }

    if (project.id === 'notch') {
        return (
            <div className="ui-notch" data-ui role="img" aria-label={project.alt}>
                <div className="ui-notch-bar" />
                <div className="ui-notch-island">
                    <span className="ui-notch-art" />
                    <span>
                        <small>{dict.notchSong}</small>
                        {dict.notchArtist}
                    </span>
                    <span className="ui-notch-wave" aria-hidden="true"><i /><i /><i /><i /></span>
                </div>
            </div>
        );
    }

    return (
        <img
            src={IMAGES[project.id]}
            alt={project.alt}
            width="1600"
            height="1000"
            loading={lazy ? 'lazy' : 'eager'}
        />
    );
}

function ProjectDetail({ project, dict, lang }) {
    const page = PAGES[project.id];
    return (
        <div className="work-detail">
            <p>{project.desc}</p>
            <p className="stack">{project.stack}</p>
            <div className="work-links">
                {page && <a href={`/${lang}/${page}`} className="button">{dict.inside}</a>}
                {project.code && <a href={project.code} target="_blank" rel="noopener noreferrer">{dict.code}</a>}
                {project.demo && <a href={project.demo} target="_blank" rel="noopener noreferrer">{dict.demo}</a>}
                {!project.code && <span className="private">{dict.private}</span>}
            </div>
        </div>
    );
}

export default function Work({ dict, lang }) {
    const projects = dict.projects;
    const [active, setActive] = useState(0);
    const asideRef = useRef(null);
    const sectionRef = useRef(null);

    // A moldura gira devagar conforme a seção passa pela tela
    useEffect(() => {
        const section = sectionRef.current;
        const aside = asideRef.current;
        if (!section || !aside) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        let frame = 0;
        const update = () => {
            frame = 0;
            const rect = section.getBoundingClientRect();
            const progress = Math.min(Math.max(-rect.top / Math.max(rect.height - window.innerHeight, 1), 0), 1);
            aside.style.setProperty('--fy', `${-22 + progress * 18}deg`);
            aside.style.setProperty('--fx', `${7 - progress * 5}deg`);
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

    const current = projects[active];

    return (
        <section id="projects" className="work" ref={sectionRef} aria-labelledby="projects-title">
            <h2 id="projects-title" className="lead" data-reveal>{dict.title}</h2>

            <ul className="work-list">
                {projects.map((project, i) => (
                    <li key={project.id} data-reveal style={{ '--i': i }}>
                        <div className="work-mobile">
                            <div className="media-shot" data-project={project.id}>
                                <ProjectMedia project={project} dict={dict} />
                            </div>
                        </div>
                        {PAGES[project.id] ? (
                            // Com página própria, o nome abre o projeto
                            <a
                                href={`/${lang}/${PAGES[project.id]}`}
                                className="work-name"
                                aria-current={i === active ? 'true' : undefined}
                                onPointerEnter={() => setActive(i)}
                                onFocus={() => setActive(i)}
                            >
                                <strong>{project.name}</strong>
                                <span>{project.meta}, {project.year}</span>
                            </a>
                        ) : (
                            <button
                                type="button"
                                className="work-name"
                                aria-pressed={i === active}
                                onClick={() => setActive(i)}
                                onPointerEnter={() => setActive(i)}
                                onFocus={() => setActive(i)}
                            >
                                <strong>{project.name}</strong>
                                <span>{project.meta}, {project.year}</span>
                            </button>
                        )}
                        <div className="work-mobile">
                            <ProjectDetail project={project} dict={dict} lang={lang} />
                        </div>
                    </li>
                ))}
            </ul>

            <div className="work-aside" ref={asideRef}>
                <div className="frame3d">
                    <div className="frame-rig">
                        {projects.map((project, i) => (
                            <div
                                key={project.id}
                                className={`frame-item${i === active ? ' is-active' : ''}${i < active ? ' is-before' : ''}`}
                                data-project={project.id}
                                aria-hidden={i !== active}
                            >
                                <ProjectMedia project={project} dict={dict} lazy={i !== 0} />
                            </div>
                        ))}
                    </div>
                </div>
                <div aria-live="polite">
                    <ProjectDetail project={current} dict={dict} lang={lang} />
                </div>
            </div>
        </section>
    );
}
