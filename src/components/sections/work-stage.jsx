'use client';

import { useEffect, useRef, useState } from 'react';
import { stackOf } from '@/lib/work-stacks';

// Quanto dura o mergulho na pilha antes de a página do projeto abrir
const OPEN_MS = 900;

// A pilha 3D do projeto atual (stack-world.js). No computador ela segue o nome
// sob o ponteiro; no celular, o cartão do carrossel. Sem WebGL, ela some e o
// projeto fica só com o texto, que já traz a stack.
// control: recebe open(i), que mergulha na pilha do projeto i e resolve quando a
// página dele pode abrir (na hora, se não houver 3D ou com movimento reduzido)
export default function WorkStage({ projects, active, slide, control }) {
    const stageRef = useRef(null);
    const canvasRef = useRef(null);
    const worldRef = useRef(null);
    const [phone, setPhone] = useState(false);
    const shown = phone ? slide : active;
    const shownRef = useRef(shown);

    useEffect(() => {
        const query = window.matchMedia('(max-width: 1024px)');
        const sync = () => setPhone(query.matches);
        sync();
        query.addEventListener('change', sync);
        return () => query.removeEventListener('change', sync);
    }, []);

    useEffect(() => {
        const stage = stageRef.current;
        const canvas = canvasRef.current;
        if (!stage || !canvas) return;
        let disposed = false;
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // A fonte da página entra nas etiquetas das camadas, então ela precisa ter carregado
        Promise.all([import('@/lib/stack-world'), document.fonts.ready]).then(([{ createWorld }]) => {
            if (disposed) return;
            const world = createWorld(canvas, {
                projects: projects.map(stackOf),
                still,
                onReady: () => stage.classList.add('is-ready'),
            });
            if (!world) {
                stage.classList.add('is-off');
                return;
            }
            worldRef.current = world;
            world.setProject(shownRef.current);
        }).catch(() => stage.classList.add('is-off'));

        const onPointer = (e) => {
            if (e.pointerType === 'touch' || !worldRef.current) return;
            const rect = stage.getBoundingClientRect();
            worldRef.current.setPointer((e.clientX - rect.left) / rect.width - 0.5, (e.clientY - rect.top) / rect.height - 0.5);
        };
        const onLeave = () => worldRef.current?.setPointer(0, 0);
        stage.addEventListener('pointermove', onPointer, { passive: true });
        stage.addEventListener('pointerleave', onLeave);

        // Voltando pelo histórico, a página pode reaparecer do cache como estava: no meio do mergulho
        const onShow = (e) => {
            if (!e.persisted) return;
            stage.removeAttribute('data-opening');
            worldRef.current?.setProgress(0);
        };
        window.addEventListener('pageshow', onShow);

        control.current = {
            open(i) {
                const world = worldRef.current;
                if (!world || still) return Promise.resolve();
                world.setProject(i);
                world.setPointer(0, 0);
                world.setProgress(1);
                stage.setAttribute('data-opening', '');
                return new Promise((resolve) => setTimeout(resolve, OPEN_MS));
            },
        };

        return () => {
            disposed = true;
            stage.removeEventListener('pointermove', onPointer);
            stage.removeEventListener('pointerleave', onLeave);
            window.removeEventListener('pageshow', onShow);
            control.current = null;
            worldRef.current?.dispose();
            worldRef.current = null;
        };
    }, [projects, control]);

    useEffect(() => {
        shownRef.current = shown;
        worldRef.current?.setProject(shown);
    }, [shown]);

    return (
        <div className="work-stage" ref={stageRef} data-project={projects[shown]?.id}>
            <canvas ref={canvasRef} aria-hidden="true" />
        </div>
    );
}
