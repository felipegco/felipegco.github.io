'use client';

import { useEffect, useRef, useState } from 'react';
import WorkStage from '@/components/sections/work-stage';

// Projetos que já têm página própria, com a cena 3D
const PAGES = { emove: 'e-move' };

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
    const [slide, setSlide] = useState(0);
    const listRef = useRef(null);

    // No celular a lista vira um carrossel lateral: o cartão mais perto da borda é o atual
    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        let frame = 0;
        const update = () => {
            frame = 0;
            const items = [...list.children];
            const start = list.scrollLeft + parseFloat(getComputedStyle(list).paddingLeft);
            let best = 0;
            items.forEach((item, i) => {
                if (Math.abs(item.offsetLeft - start) < Math.abs(items[best].offsetLeft - start)) best = i;
            });
            setSlide(best);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        list.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            list.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(frame);
        };
    }, []);

    const goTo = (i) => {
        const list = listRef.current;
        const item = list?.children[i];
        if (!item) return;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        list.scrollTo({ left: item.offsetLeft - parseFloat(getComputedStyle(list).paddingLeft), behavior: reduced ? 'auto' : 'smooth' });
    };

    const current = projects[active];

    return (
        <section id="projects" className="work" data-slide aria-labelledby="projects-title">
            <h2 id="projects-title" className="lead" data-reveal>{dict.title}</h2>

            {/* A pilha 3D do projeto e, no computador, os detalhes dele */}
            <div className="work-aside">
                <WorkStage projects={projects} active={active} slide={slide} />
                <div className="work-aside-detail" aria-live="polite">
                    <ProjectDetail project={current} dict={dict} lang={lang} />
                </div>
            </div>

            <ul className="work-list" ref={listRef} aria-label={dict.track}>
                {projects.map((project, i) => (
                    <li key={project.id} data-reveal style={{ '--i': i }}>
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

            {/* Só no celular: onde o carrossel está e atalhos para cada cartão */}
            <div className="work-dots">
                <span className="work-count" aria-hidden="true">{slide + 1} / {projects.length}</span>
                <div>
                    {projects.map((project, i) => (
                        <button
                            key={project.id}
                            type="button"
                            aria-label={dict.slide.replace('{n}', i + 1).replace('{total}', projects.length)}
                            aria-current={i === slide ? 'true' : undefined}
                            onClick={() => goTo(i)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
