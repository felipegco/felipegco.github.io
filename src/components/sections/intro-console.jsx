'use client';

import { useEffect, useRef, useState } from 'react';

const HOST = 'felipe.dev';

// Largura da resposta em caracteres: listas maiores quebram em várias linhas
const WIDTH = 50;

// Uma chave por linha; listas curtas numa linha só, as longas em linhas cheias
function format(body) {
    const rows = Object.entries(body).map(([k, v]) => {
        const head = `  "${k}": `;
        if (!Array.isArray(v)) return head + JSON.stringify(v);
        const items = v.map((item) => JSON.stringify(item));
        const inline = `[${items.join(', ')}]`;
        if (head.length + inline.length <= WIDTH) return head + inline;
        const lines = [];
        let line = '';
        items.forEach((item) => {
            if (line && line.length + item.length + 2 > WIDTH - 4) {
                lines.push(`${line},`);
                line = item;
            } else {
                line = line ? `${line}, ${item}` : item;
            }
        });
        lines.push(line);
        return `${head}[\n${lines.map((l) => `    ${l}`).join('\n')}\n  ]`;
    });
    return `{\n${rows.join(',\n')}\n}`;
}

const TOKEN = /("[^"]*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g;

function highlight(text) {
    const parts = [];
    let last = 0;
    for (const m of text.matchAll(TOKEN)) {
        if (m.index > last) parts.push(text.slice(last, m.index));
        if (m[1] && m[2]) {
            parts.push(<span key={m.index} className="k">{m[1]}</span>, m[2]);
        } else {
            parts.push(<span key={m.index} className={m[1] ? 's' : 'n'}>{m[0]}</span>);
        }
        last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
}

// O console da introdução: escolhe um endpoint, executa e a resposta se digita.
// Na primeira vez que o card aparece ele roda o primeiro endpoint sozinho.
export default function IntroConsole({ dict }) {
    const { endpoints } = dict;
    const [index, setIndex] = useState(0);
    const [shown, setShown] = useState('');
    const [ms, setMs] = useState(0);
    const [running, setRunning] = useState(false);
    const ref = useRef(null);
    const outRef = useRef(null);
    const timer = useRef(0);

    const run = (i = index) => {
        clearInterval(timer.current);
        const text = format(endpoints[i].body);
        setMs(28 + Math.round(Math.random() * 30));
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setShown(text);
            return;
        }
        setRunning(true);
        setShown('');
        if (outRef.current) outRef.current.scrollTop = 0;
        let at = 0;
        timer.current = setInterval(() => {
            at = Math.min(at + 5, text.length);
            setShown(text.slice(0, at));
            // A resposta longa rola dentro do console, como num terminal
            const out = outRef.current;
            if (out) out.scrollTop = out.scrollHeight;
            if (at === text.length) {
                clearInterval(timer.current);
                setRunning(false);
            }
        }, 16);
    };

    useEffect(() => {
        const beat = ref.current?.closest('.scene3d-beat');
        if (!beat) return;
        let done = false;
        let wait = 0;
        const check = () => {
            if (done || !beat.classList.contains('is-on')) return;
            done = true;
            observer.disconnect();
            wait = setTimeout(() => run(0), 700);
        };
        const observer = new MutationObserver(check);
        observer.observe(beat, { attributes: true, attributeFilter: ['class'] });
        check();
        return () => {
            observer.disconnect();
            clearTimeout(wait);
            clearInterval(timer.current);
        };
        // roda uma vez só, na primeira aparição do card
    }, []);

    return (
        <div className="api-console" ref={ref} role="group" aria-label={dict.label}>
            <div className="api-bar">
                <span className="api-method">GET</span>
                <label className="api-url">
                    <span className="visually-hidden">{dict.endpoint}</span>
                    <span className="api-host" aria-hidden="true">{HOST}</span>
                    <select
                        value={index}
                        onChange={(e) => {
                            const i = Number(e.target.value);
                            setIndex(i);
                            run(i);
                        }}
                    >
                        {endpoints.map((ep, i) => <option key={ep.path} value={i}>{ep.path}</option>)}
                    </select>
                </label>
                <button type="button" className="api-run" onClick={() => run()} disabled={running}>
                    {running ? dict.running : dict.run}
                </button>
            </div>
            <pre className="api-out" ref={outRef} aria-live="polite" tabIndex={0} data-lenis-prevent><code>
                {shown || ms ? (
                    <>
                        <span className="api-status">200 OK · {ms} ms</span>
                        {highlight(shown)}
                        {running && <span className="api-caret" aria-hidden="true" />}
                    </>
                ) : (
                    <span className="api-hint">{dict.hint}</span>
                )}
            </code></pre>
        </div>
    );
}
