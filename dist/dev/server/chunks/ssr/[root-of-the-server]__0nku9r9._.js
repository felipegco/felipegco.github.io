module.exports = [
"[project]/src/lib/motion.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "loadMotion",
    ()=>loadMotion
]);
// GSAP, ScrollTrigger e Lenis carregados uma vez só para a página inteira.
// As cenas 3D pedem por aqui; quem chega primeiro cria, as outras reaproveitam.
let loading = null;
// Arranca na hora (o gesto já tem resposta) e freia devagar até o card
const easeOut = (t)=>1 - Math.pow(1 - t, 4);
// Quanto o gesto precisa andar para virar a página (roda/trackpad e toque)
const WHEEL_STEP = 24;
const SWIPE_STEP = 40;
// Pausa que separa um gesto do outro: a inércia do trackpad não vira duas páginas
const QUIET = 200;
// Seção mais alta que a tela anda neste pedaço da tela por vez, sem pular nada
const PAGE = 0.85;
const isField = (el)=>!!el?.closest?.('input, select, textarea, [contenteditable="true"], [data-lenis-prevent]');
function loadMotion() {
    if (loading) return loading;
    loading = Promise.all([
        __turbopack_context__.A("[project]/node_modules/gsap/index.js [app-ssr] (ecmascript, async loader)"),
        __turbopack_context__.A("[project]/node_modules/gsap/ScrollTrigger.js [app-ssr] (ecmascript, async loader)"),
        __turbopack_context__.A("[project]/node_modules/lenis/dist/lenis.mjs [app-ssr] (ecmascript, async loader)")
    ]).then(([{ gsap }, { ScrollTrigger }, { default: Lenis }])=>{
        gsap.registerPlugin(ScrollTrigger);
        let lenis = null;
        let busy = false;
        // Paradas da página: as cenas registram as delas; as outras seções marcam [data-slide]
        const providers = new Set();
        const addStops = (fn)=>{
            providers.add(fn);
            return ()=>providers.delete(fn);
        };
        const stops = ()=>{
            const limit = lenis.limit;
            const list = [
                0,
                limit
            ];
            providers.forEach((fn)=>list.push(...fn()));
            document.querySelectorAll('[data-slide]').forEach((el)=>{
                list.push(el.getBoundingClientRect().top + window.scrollY);
            });
            return list.map((y)=>Math.min(Math.max(Math.round(y), 0), limit)).sort((a, b)=>a - b).filter((y, i, all)=>i === 0 || y - all[i - 1] > 4);
        };
        const glideTo = (top, { duration = 1.6, onComplete } = {})=>{
            if (!lenis) {
                window.scrollTo({
                    top,
                    behavior: 'smooth'
                });
                onComplete?.();
                return;
            }
            busy = true;
            lenis.scrollTo(top, {
                duration,
                lock: true,
                force: true,
                easing: easeOut,
                onComplete: ()=>{
                    busy = false;
                    onComplete?.();
                }
            });
        };
        // Um card por vez: vai até a próxima parada; se ela estiver a mais de uma tela,
        // divide o caminho em pedaços iguais para o texto do meio passar pela tela
        const step = (dir)=>{
            if (busy) return;
            const y = lenis.targetScroll;
            const vh = window.innerHeight;
            const list = stops();
            const next = dir > 0 ? list.find((s)=>s > y + 4) : list.findLast((s)=>s < y - 4);
            if (next === undefined) return;
            const dist = Math.abs(next - y);
            const parts = dist <= vh * 1.05 ? 1 : Math.ceil(dist / (vh * PAGE));
            const move = dist / parts;
            glideTo(y + dir * move, {
                duration: Math.min(1.3 + move / vh * 0.4, 2)
            });
        };
        // Rolagem em slides no mouse, no trackpad e no toque; o movimento reduzido fica nativo
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduced) {
            let armed = true;
            let acc = 0;
            let lastWheel = 0;
            let touch = null;
            lenis = new Lenis({
                lerp: 0.06,
                smoothWheel: true,
                autoRaf: false,
                // Toda rolada do usuário passa por aqui e vira, no máximo, uma página por gesto
                virtualScroll: ({ deltaX, deltaY, event })=>{
                    if (event.ctrlKey) return true;
                    if (event.type === 'wheel') {
                        if (Math.abs(deltaX) > Math.abs(deltaY)) return true;
                        if (event.cancelable) event.preventDefault();
                        const now = performance.now();
                        if (now - lastWheel > QUIET) {
                            armed = true;
                            acc = 0;
                        }
                        lastWheel = now;
                        if (busy || !armed) return false;
                        acc += deltaY;
                        if (Math.abs(acc) >= WHEEL_STEP) {
                            armed = false;
                            step(Math.sign(acc));
                        }
                        return false;
                    }
                    // Toque: o arrasto não rola a página; ao soltar, um swipe vira um card
                    const point = event.touches?.[0] ?? event.changedTouches?.[0];
                    if (event.type === 'touchstart') {
                        touch = event.touches.length > 1 || isField(event.target) ? null : {
                            x: point.clientX,
                            y: point.clientY
                        };
                        return false;
                    }
                    if (!touch) return true;
                    const dx = point.clientX - touch.x;
                    const dy = point.clientY - touch.y;
                    if (event.type === 'touchmove') {
                        if (event.touches.length > 1) {
                            touch = null;
                            return true;
                        }
                        if (Math.abs(dy) > Math.abs(dx) && event.cancelable) event.preventDefault();
                        return false;
                    }
                    touch = null;
                    if (Math.abs(dy) > SWIPE_STEP && Math.abs(dy) > Math.abs(dx)) step(dy < 0 ? 1 : -1);
                    return false;
                }
            });
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((t)=>lenis.raf(t * 1000));
            gsap.ticker.lagSmoothing(0);
            // Teclado: setas, Page Up/Down e espaço também andam um card
            const KEYS = {
                ArrowDown: 1,
                PageDown: 1,
                ' ': 1,
                ArrowUp: -1,
                PageUp: -1
            };
            window.addEventListener('keydown', (e)=>{
                if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isField(e.target)) return;
                let dir = KEYS[e.key];
                if (!dir) return;
                if (e.key === ' ' && e.target.closest?.('button, a')) return;
                if (e.key === ' ' && e.shiftKey) dir = -1;
                e.preventDefault();
                step(dir);
            });
            // Links de âncora deslizam até o destino sem parar nas cenas do caminho
            document.addEventListener('click', (e)=>{
                if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
                const link = e.target.closest?.('a[href^="#"]');
                const el = link && document.getElementById(link.getAttribute('href').slice(1));
                if (!el) return;
                e.preventDefault();
                glideTo(el.getBoundingClientRect().top + window.scrollY, {
                    duration: 2
                });
            });
        }
        return {
            gsap,
            ScrollTrigger,
            lenis,
            glideTo,
            addStops
        };
    });
    return loading;
}
}),
"[project]/src/components/scene-3d.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Scene3D
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$motion$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/motion.js [app-ssr] (ecmascript)");
'use client';
;
;
;
const WORLDS = {
    intro: ()=>__turbopack_context__.A("[project]/src/lib/intro-world.js [app-ssr] (ecmascript, async loader)"),
    request: ()=>__turbopack_context__.A("[project]/src/lib/request-world.js [app-ssr] (ecmascript, async loader)")
};
function Scene3D({ id, world, labels, label, hold, holdStacked, outro = 0, header, backdrop, route, routeLabel, className = '', children }) {
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const section = ref.current;
        const canvas = canvasRef.current;
        if (!section || !canvas) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            section.classList.add('is-rest');
            return;
        }
        let instance = null;
        let trigger = null;
        let motion = null;
        let disposed = false;
        let removeStops = null;
        const beats = [
            ...section.querySelectorAll('.scene3d-beat')
        ];
        const stops = [
            ...section.querySelectorAll('.scene3d-route a')
        ];
        // Paradas com texto (0 … last) e, depois delas, as telas de saída (até total)
        const last = beats.length - 1;
        const total = last + outro;
        let shown = -2;
        const showBeat = (p)=>{
            const s = p * total;
            const near = Math.round(s);
            const next = near <= last && Math.abs(s - near) < 0.12 ? near : -1;
            if (next === shown) return;
            shown = next;
            beats.forEach((el, i)=>el.classList.toggle('is-on', i === next));
            stops.forEach((el, i)=>{
                if (i === near) el.setAttribute('aria-current', 'step');
                else el.removeAttribute('aria-current');
            });
        };
        // Posição da rolagem de cada parada
        const yAt = (k)=>trigger.start + k / total * (trigger.end - trigger.start);
        const onStopClick = (e)=>{
            const i = stops.indexOf(e.currentTarget);
            if (i < 0 || !trigger) return;
            e.preventDefault();
            motion.glideTo(yAt(i), {
                duration: 1.8
            });
        };
        stops.forEach((el)=>el.addEventListener('click', onStopClick));
        const onPointer = (e)=>{
            if (e.pointerType === 'touch' || !instance) return;
            instance.setPointer(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
        };
        (async ()=>{
            try {
                const [{ createWorld }, loaded] = await Promise.all([
                    WORLDS[world](),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$motion$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["loadMotion"])()
                ]);
                if (disposed) return;
                motion = loaded;
                instance = createWorld(canvas, {
                    labels,
                    onReady: ()=>section.classList.add('is-ready')
                });
                if (!instance) throw new Error('WebGL indisponível');
                section.classList.add('is-live');
                trigger = motion.ScrollTrigger.create({
                    trigger: section,
                    start: 'top top',
                    end: 'bottom bottom',
                    onUpdate: (self)=>{
                        instance.setProgress(self.progress);
                        showBeat(self.progress);
                        // Na saída, o texto do palco some no ritmo da cortina que sobe por cima
                        if (outro) section.style.setProperty('--outro', Math.min(Math.max(self.progress * total - last, 0), outro) / outro);
                    }
                });
                // A altura muda quando a cena fica viva: os outros gatilhos precisam medir de novo
                motion.ScrollTrigger.refresh();
                instance.setProgress(trigger.progress);
                showBeat(trigger.progress);
                window.addEventListener('pointermove', onPointer, {
                    passive: true
                });
                removeStops = motion.addStops(()=>Array.from({
                        length: total + 1
                    }, (_, k)=>yAt(k)));
            } catch  {
                section.classList.remove('is-live');
                section.classList.add('is-rest');
            }
        })();
        return ()=>{
            disposed = true;
            stops.forEach((el)=>el.removeEventListener('click', onStopClick));
            window.removeEventListener('pointermove', onPointer);
            removeStops?.();
            trigger?.kill();
            instance?.dispose();
        };
    }, [
        world,
        labels,
        outro
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: id,
        className: `scene scene3d ${className}`,
        "data-scene": world,
        ref: ref,
        "aria-label": label,
        "data-slide": true,
        style: {
            '--hold': hold,
            '--hold-stacked': holdStacked ?? hold
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "scene3d-stage",
            children: [
                backdrop && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "scene3d-backdrop",
                    children: backdrop
                }, void 0, false, {
                    fileName: "[project]/src/components/scene-3d.jsx",
                    lineNumber: 132,
                    columnNumber: 30
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                    className: "scene3d-canvas",
                    ref: canvasRef,
                    "aria-hidden": "true"
                }, void 0, false, {
                    fileName: "[project]/src/components/scene-3d.jsx",
                    lineNumber: 133,
                    columnNumber: 17
                }, this),
                header,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "scene3d-beats",
                    children: children
                }, void 0, false, {
                    fileName: "[project]/src/components/scene-3d.jsx",
                    lineNumber: 135,
                    columnNumber: 17
                }, this),
                route && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                    className: "scene3d-route",
                    "aria-label": routeLabel,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                        children: route.map((stop, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: `#stop-${stop.id}`,
                                    "aria-current": i === 0 ? 'step' : undefined,
                                    children: stop.name
                                }, void 0, false, {
                                    fileName: "[project]/src/components/scene-3d.jsx",
                                    lineNumber: 141,
                                    columnNumber: 37
                                }, this)
                            }, stop.id, false, {
                                fileName: "[project]/src/components/scene-3d.jsx",
                                lineNumber: 140,
                                columnNumber: 33
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/scene-3d.jsx",
                        lineNumber: 138,
                        columnNumber: 25
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/scene-3d.jsx",
                    lineNumber: 137,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/scene-3d.jsx",
            lineNumber: 131,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/scene-3d.jsx",
        lineNumber: 122,
        columnNumber: 9
    }, this);
}
}),
"[project]/src/components/ui/ThemeToggle.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ThemeToggle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$ThemeContext$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/ThemeContext.jsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/moon.js [app-ssr] (ecmascript) <export default as Moon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sun.js [app-ssr] (ecmascript) <export default as Sun>");
'use client';
;
;
;
function ThemeToggle({ labels }) {
    const { theme, toggleTheme } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$ThemeContext$2e$jsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useTheme"])();
    const label = theme === 'dark' ? labels.themeLight : labels.themeDark;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        onClick: toggleTheme,
        className: "tool",
        "aria-label": label,
        title: label,
        children: theme === 'dark' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"], {
            size: 18,
            "aria-hidden": "true"
        }, void 0, false, {
            fileName: "[project]/src/components/ui/ThemeToggle.jsx",
            lineNumber: 12,
            columnNumber: 33
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"], {
            size: 18,
            "aria-hidden": "true"
        }, void 0, false, {
            fileName: "[project]/src/components/ui/ThemeToggle.jsx",
            lineNumber: 12,
            columnNumber: 72
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/ui/ThemeToggle.jsx",
        lineNumber: 11,
        columnNumber: 9
    }, this);
}
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/components/ui/LanguagePicker.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LanguagePicker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
"use client";
;
;
;
function LanguagePicker({ lang, labels }) {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const redirectedPathname = (locale)=>{
        if (!pathname) return `/${locale}`;
        const segments = pathname.split("/");
        // O locale é sempre o primeiro segmento (felipegco.github.io/pt)
        segments[1] = locale;
        return segments.join("/");
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        href: redirectedPathname(lang === "pt" ? "en" : "pt"),
        className: "tool",
        "aria-label": labels.switchLang,
        title: labels.switchLang,
        children: labels.langShort
    }, void 0, false, {
        fileName: "[project]/src/components/ui/LanguagePicker.jsx",
        lineNumber: 18,
        columnNumber: 9
    }, this);
}
}),
"[project]/src/components/sections/work.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Work
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
// Projetos que já têm página própria, com a cena 3D
const PAGES = {
    emove: 'e-move'
};
const IMAGES = {
    greentech: '/images/work/greentech.jpg',
    clinicare: '/images/work/clinicare.jpg',
    mesas: '/images/work/mesas.jpg'
};
function ProjectMedia({ project, dict, lazy = true }) {
    if (project.id === 'emove') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
            src: "/media/emove-scroll.webm",
            poster: "/images/work/emove.jpg",
            muted: true,
            loop: true,
            autoPlay: true,
            playsInline: true,
            preload: "none",
            "aria-label": project.alt
        }, void 0, false, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 17,
            columnNumber: 13
        }, this);
    }
    if (project.id === 'atoll') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "media-logo",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                src: "/images/work/atoll.png",
                alt: project.alt,
                width: "512",
                height: "512",
                loading: "lazy"
            }, void 0, false, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 33,
                columnNumber: 17
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 32,
            columnNumber: 13
        }, this);
    }
    if (project.id === 'triagem') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "ui-chat",
            "data-ui": true,
            role: "img",
            "aria-label": project.alt,
            children: dict.triage.map((row)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "ui-chat-row",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "ui-chat-msg",
                            children: row.msg
                        }, void 0, false, {
                            fileName: "[project]/src/components/sections/work.jsx",
                            lineNumber: 43,
                            columnNumber: 25
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "ui-chat-tag",
                            children: row.label
                        }, void 0, false, {
                            fileName: "[project]/src/components/sections/work.jsx",
                            lineNumber: 44,
                            columnNumber: 25
                        }, this)
                    ]
                }, row.msg, true, {
                    fileName: "[project]/src/components/sections/work.jsx",
                    lineNumber: 42,
                    columnNumber: 21
                }, this))
        }, void 0, false, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 40,
            columnNumber: 13
        }, this);
    }
    if (project.id === 'notch') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "ui-notch",
            "data-ui": true,
            role: "img",
            "aria-label": project.alt,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "ui-notch-bar"
                }, void 0, false, {
                    fileName: "[project]/src/components/sections/work.jsx",
                    lineNumber: 54,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "ui-notch-island",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "ui-notch-art"
                        }, void 0, false, {
                            fileName: "[project]/src/components/sections/work.jsx",
                            lineNumber: 56,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                    children: dict.notchSong
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/work.jsx",
                                    lineNumber: 58,
                                    columnNumber: 25
                                }, this),
                                dict.notchArtist
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/sections/work.jsx",
                            lineNumber: 57,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "ui-notch-wave",
                            "aria-hidden": "true",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                                    fileName: "[project]/src/components/sections/work.jsx",
                                    lineNumber: 61,
                                    columnNumber: 72
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                                    fileName: "[project]/src/components/sections/work.jsx",
                                    lineNumber: 61,
                                    columnNumber: 77
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                                    fileName: "[project]/src/components/sections/work.jsx",
                                    lineNumber: 61,
                                    columnNumber: 82
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                                    fileName: "[project]/src/components/sections/work.jsx",
                                    lineNumber: 61,
                                    columnNumber: 87
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/sections/work.jsx",
                            lineNumber: 61,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/sections/work.jsx",
                    lineNumber: 55,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 53,
            columnNumber: 13
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
        src: IMAGES[project.id],
        alt: project.alt,
        width: "1600",
        height: "1000",
        loading: lazy ? 'lazy' : 'eager'
    }, void 0, false, {
        fileName: "[project]/src/components/sections/work.jsx",
        lineNumber: 68,
        columnNumber: 9
    }, this);
}
function ProjectDetail({ project, dict, lang }) {
    const page = PAGES[project.id];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "work-detail",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: project.desc
            }, void 0, false, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 82,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "stack",
                children: project.stack
            }, void 0, false, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 83,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "work-links",
                children: [
                    page && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: `/${lang}/${page}`,
                        className: "button",
                        children: dict.inside
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/work.jsx",
                        lineNumber: 85,
                        columnNumber: 26
                    }, this),
                    project.code && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: project.code,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        children: dict.code
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/work.jsx",
                        lineNumber: 86,
                        columnNumber: 34
                    }, this),
                    project.demo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: project.demo,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        children: dict.demo
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/work.jsx",
                        lineNumber: 87,
                        columnNumber: 34
                    }, this),
                    !project.code && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "private",
                        children: dict.private
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/work.jsx",
                        lineNumber: 88,
                        columnNumber: 35
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 84,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/sections/work.jsx",
        lineNumber: 81,
        columnNumber: 9
    }, this);
}
function Work({ dict, lang }) {
    const projects = dict.projects;
    const [active, setActive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const asideRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const sectionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // A moldura gira devagar conforme a seção passa pela tela
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const section = sectionRef.current;
        const aside = asideRef.current;
        if (!section || !aside) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        let frame = 0;
        const update = ()=>{
            frame = 0;
            const rect = section.getBoundingClientRect();
            const progress = Math.min(Math.max(-rect.top / Math.max(rect.height - window.innerHeight, 1), 0), 1);
            aside.style.setProperty('--fy', `${-22 + progress * 18}deg`);
            aside.style.setProperty('--fx', `${7 - progress * 5}deg`);
        };
        const onScroll = ()=>{
            if (!frame) frame = requestAnimationFrame(update);
        };
        update();
        window.addEventListener('scroll', onScroll, {
            passive: true
        });
        return ()=>{
            window.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(frame);
        };
    }, []);
    const current = projects[active];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "projects",
        className: "work",
        "data-slide": true,
        ref: sectionRef,
        "aria-labelledby": "projects-title",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                id: "projects-title",
                className: "lead",
                "data-reveal": true,
                children: dict.title
            }, void 0, false, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 130,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "work-list",
                children: projects.map((project, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        "data-reveal": true,
                        style: {
                            '--i': i
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "work-mobile",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "media-shot",
                                    "data-project": project.id,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ProjectMedia, {
                                        project: project,
                                        dict: dict
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/work.jsx",
                                        lineNumber: 137,
                                        columnNumber: 33
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/work.jsx",
                                    lineNumber: 136,
                                    columnNumber: 29
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/work.jsx",
                                lineNumber: 135,
                                columnNumber: 25
                            }, this),
                            PAGES[project.id] ? // Com página própria, o nome abre o projeto
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: `/${lang}/${PAGES[project.id]}`,
                                className: "work-name",
                                "aria-current": i === active ? 'true' : undefined,
                                onPointerEnter: ()=>setActive(i),
                                onFocus: ()=>setActive(i),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: project.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/work.jsx",
                                        lineNumber: 149,
                                        columnNumber: 33
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            project.meta,
                                            ", ",
                                            project.year
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/sections/work.jsx",
                                        lineNumber: 150,
                                        columnNumber: 33
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/sections/work.jsx",
                                lineNumber: 142,
                                columnNumber: 29
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "work-name",
                                "aria-pressed": i === active,
                                onClick: ()=>setActive(i),
                                onPointerEnter: ()=>setActive(i),
                                onFocus: ()=>setActive(i),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: project.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/work.jsx",
                                        lineNumber: 161,
                                        columnNumber: 33
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            project.meta,
                                            ", ",
                                            project.year
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/sections/work.jsx",
                                        lineNumber: 162,
                                        columnNumber: 33
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/sections/work.jsx",
                                lineNumber: 153,
                                columnNumber: 29
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "work-mobile",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ProjectDetail, {
                                    project: project,
                                    dict: dict,
                                    lang: lang
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/work.jsx",
                                    lineNumber: 166,
                                    columnNumber: 29
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/work.jsx",
                                lineNumber: 165,
                                columnNumber: 25
                            }, this)
                        ]
                    }, project.id, true, {
                        fileName: "[project]/src/components/sections/work.jsx",
                        lineNumber: 134,
                        columnNumber: 21
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 132,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "work-aside",
                ref: asideRef,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "frame3d",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "frame-rig",
                            children: projects.map((project, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `frame-item${i === active ? ' is-active' : ''}${i < active ? ' is-before' : ''}`,
                                    "data-project": project.id,
                                    "aria-hidden": i !== active,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ProjectMedia, {
                                        project: project,
                                        dict: dict,
                                        lazy: i !== 0
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/work.jsx",
                                        lineNumber: 182,
                                        columnNumber: 33
                                    }, this)
                                }, project.id, false, {
                                    fileName: "[project]/src/components/sections/work.jsx",
                                    lineNumber: 176,
                                    columnNumber: 29
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/components/sections/work.jsx",
                            lineNumber: 174,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/work.jsx",
                        lineNumber: 173,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "aria-live": "polite",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ProjectDetail, {
                            project: current,
                            dict: dict,
                            lang: lang
                        }, void 0, false, {
                            fileName: "[project]/src/components/sections/work.jsx",
                            lineNumber: 188,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/work.jsx",
                        lineNumber: 187,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 172,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/sections/work.jsx",
        lineNumber: 129,
        columnNumber: 9
    }, this);
}
}),
"[project]/src/components/sections/journey.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Journey
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
// Calendário acadêmico da FHO: dois semestres por ano, de mar/2024 a dez/2027
const SEMESTER_STARTS = [
    '2024-03-01',
    '2024-08-01',
    '2025-03-01',
    '2025-08-01',
    '2026-03-01',
    '2026-08-01',
    '2027-03-01',
    '2027-08-01'
];
const TOTAL_SEMS = SEMESTER_STARTS.length;
function useCurrentSemester() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const now = new Date();
        const started = SEMESTER_STARTS.filter((d)=>new Date(d) <= now).length;
        return Math.min(Math.max(started, 1), TOTAL_SEMS);
    }, []);
}
function Journey({ dict }) {
    const semester = useCurrentSemester();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "journey",
        className: "journey",
        "data-slide": true,
        "aria-labelledby": "journey-title",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "journey-sheet",
            "data-reveal": true,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    id: "journey-title",
                    children: dict.title
                }, void 0, false, {
                    fileName: "[project]/src/components/sections/journey.jsx",
                    lineNumber: 23,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "journey-note",
                    children: dict.note
                }, void 0, false, {
                    fileName: "[project]/src/components/sections/journey.jsx",
                    lineNumber: 24,
                    columnNumber: 17
                }, this),
                dict.groups.map((group)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "journey-group",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: group.name
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/journey.jsx",
                                lineNumber: 28,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                children: group.items.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "journey-row",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: item.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/sections/journey.jsx",
                                                        lineNumber: 33,
                                                        columnNumber: 41
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: item.when
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/sections/journey.jsx",
                                                        lineNumber: 34,
                                                        columnNumber: 41
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/sections/journey.jsx",
                                                lineNumber: 32,
                                                columnNumber: 37
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "journey-desc",
                                                children: item.desc.replace('{n}', semester).replace('{total}', TOTAL_SEMS)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/sections/journey.jsx",
                                                lineNumber: 36,
                                                columnNumber: 37
                                            }, this)
                                        ]
                                    }, item.name, true, {
                                        fileName: "[project]/src/components/sections/journey.jsx",
                                        lineNumber: 31,
                                        columnNumber: 33
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/journey.jsx",
                                lineNumber: 29,
                                columnNumber: 25
                            }, this)
                        ]
                    }, group.name, true, {
                        fileName: "[project]/src/components/sections/journey.jsx",
                        lineNumber: 27,
                        columnNumber: 21
                    }, this)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "journey-closing",
                    children: [
                        dict.closing[0],
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                            fileName: "[project]/src/components/sections/journey.jsx",
                            lineNumber: 46,
                            columnNumber: 38
                        }, this),
                        dict.closing[1]
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/sections/journey.jsx",
                    lineNumber: 45,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/sections/journey.jsx",
            lineNumber: 22,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/sections/journey.jsx",
        lineNumber: 21,
        columnNumber: 9
    }, this);
}
}),
"[project]/src/components/sections/contact.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Contact
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.js [app-ssr] (ecmascript) <export default as ArrowRight>");
'use client';
;
;
;
const EMAIL = 'fgiacominicocco@gmail.com';
function Contact({ dict }) {
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(dict.subject)}&body=${encodeURIComponent(message)}`;
    const handleSubmit = (e)=>{
        e.preventDefault();
        window.location.href = mailto;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "contact",
        className: "contact",
        "data-slide": true,
        "aria-labelledby": "contact-title",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                id: "contact-title",
                className: "lead",
                "data-reveal": true,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: dict.line1
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/contact.jsx",
                        lineNumber: 21,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: dict.line2
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/contact.jsx",
                        lineNumber: 22,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/sections/contact.jsx",
                lineNumber: 20,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                action: `mailto:${EMAIL}`,
                method: "post",
                encType: "text/plain",
                onSubmit: handleSubmit,
                "data-reveal": true,
                style: {
                    '--i': 1
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "visually-hidden",
                        htmlFor: "contact-message",
                        children: dict.placeholder
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/contact.jsx",
                        lineNumber: 26,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        id: "contact-message",
                        name: "mensagem",
                        type: "text",
                        placeholder: dict.placeholder,
                        value: message,
                        onChange: (e)=>setMessage(e.target.value),
                        autoComplete: "off"
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/contact.jsx",
                        lineNumber: 27,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "submit",
                        className: "button send",
                        "aria-label": dict.submit,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
                            size: 20,
                            "aria-hidden": "true"
                        }, void 0, false, {
                            fileName: "[project]/src/components/sections/contact.jsx",
                            lineNumber: 37,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/contact.jsx",
                        lineNumber: 36,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/sections/contact.jsx",
                lineNumber: 25,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "contact-after",
                "data-reveal": true,
                style: {
                    '--i': 2
                },
                children: dict.after
            }, void 0, false, {
                fileName: "[project]/src/components/sections/contact.jsx",
                lineNumber: 40,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                "data-reveal": true,
                style: {
                    '--i': 3
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                        children: dict.email
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/contact.jsx",
                        lineNumber: 43,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: `mailto:${EMAIL}`,
                            children: EMAIL
                        }, void 0, false, {
                            fileName: "[project]/src/components/sections/contact.jsx",
                            lineNumber: 44,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/contact.jsx",
                        lineNumber: 44,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                        children: dict.linkedin
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/contact.jsx",
                        lineNumber: 45,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: "https://www.linkedin.com/in/felipegcocco/",
                            target: "_blank",
                            rel: "noopener noreferrer",
                            children: "linkedin.com/in/felipegcocco"
                        }, void 0, false, {
                            fileName: "[project]/src/components/sections/contact.jsx",
                            lineNumber: 46,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/contact.jsx",
                        lineNumber: 46,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                        children: dict.github
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/contact.jsx",
                        lineNumber: 47,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: "https://github.com/felipegco",
                            target: "_blank",
                            rel: "noopener noreferrer",
                            children: "github.com/felipegco"
                        }, void 0, false, {
                            fileName: "[project]/src/components/sections/contact.jsx",
                            lineNumber: 48,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/sections/contact.jsx",
                        lineNumber: 48,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/sections/contact.jsx",
                lineNumber: 42,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/sections/contact.jsx",
        lineNumber: 19,
        columnNumber: 9
    }, this);
}
}),
"[project]/src/components/RevealObserver.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RevealObserver
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
function RevealObserver() {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const pending = new Set(document.querySelectorAll('[data-reveal]'));
        const reveal = (el)=>{
            el.classList.add('in');
            pending.delete(el);
            observer.unobserve(el);
        };
        const observer = new IntersectionObserver((entries)=>{
            entries.forEach((entry)=>{
                if (entry.isIntersecting) reveal(entry.target);
            });
        }, {
            rootMargin: '0px 0px -8% 0px'
        });
        let frame = 0;
        const catchUp = ()=>{
            frame = 0;
            pending.forEach((el)=>{
                if (el.getBoundingClientRect().top < window.innerHeight * 0.92) reveal(el);
            });
            if (!pending.size) window.removeEventListener('scroll', onScroll);
        };
        const onScroll = ()=>{
            if (!frame) frame = requestAnimationFrame(catchUp);
        };
        pending.forEach((el)=>observer.observe(el));
        window.addEventListener('scroll', onScroll, {
            passive: true
        });
        return ()=>{
            observer.disconnect();
            window.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(frame);
        };
    }, []);
    return null;
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0nku9r9._.js.map