(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/motion.js [app-client] (ecmascript)", ((__turbopack_context__) => {
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
        __turbopack_context__.A("[project]/node_modules/gsap/index.js [app-client] (ecmascript, async loader)"),
        __turbopack_context__.A("[project]/node_modules/gsap/ScrollTrigger.js [app-client] (ecmascript, async loader)"),
        __turbopack_context__.A("[project]/node_modules/lenis/dist/lenis.mjs [app-client] (ecmascript, async loader)")
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/scene-3d.jsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Scene3D
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$motion$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/motion.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const WORLDS = {
    intro: ()=>__turbopack_context__.A("[project]/src/lib/intro-world.js [app-client] (ecmascript, async loader)"),
    request: ()=>__turbopack_context__.A("[project]/src/lib/request-world.js [app-client] (ecmascript, async loader)")
};
function Scene3D({ id, world, labels, label, hold, holdStacked, outro = 0, header, backdrop, route, routeLabel, className = '', children }) {
    _s();
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Scene3D.useEffect": ()=>{
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
            const showBeat = {
                "Scene3D.useEffect.showBeat": (p)=>{
                    const s = p * total;
                    const near = Math.round(s);
                    const next = near <= last && Math.abs(s - near) < 0.12 ? near : -1;
                    if (next === shown) return;
                    shown = next;
                    beats.forEach({
                        "Scene3D.useEffect.showBeat": (el, i)=>el.classList.toggle('is-on', i === next)
                    }["Scene3D.useEffect.showBeat"]);
                    stops.forEach({
                        "Scene3D.useEffect.showBeat": (el_0, i_0)=>{
                            if (i_0 === near) el_0.setAttribute('aria-current', 'step');
                            else el_0.removeAttribute('aria-current');
                        }
                    }["Scene3D.useEffect.showBeat"]);
                }
            }["Scene3D.useEffect.showBeat"];
            // Posição da rolagem de cada parada
            const yAt = {
                "Scene3D.useEffect.yAt": (k)=>trigger.start + k / total * (trigger.end - trigger.start)
            }["Scene3D.useEffect.yAt"];
            const onStopClick = {
                "Scene3D.useEffect.onStopClick": (e)=>{
                    const i_1 = stops.indexOf(e.currentTarget);
                    if (i_1 < 0 || !trigger) return;
                    e.preventDefault();
                    motion.glideTo(yAt(i_1), {
                        duration: 1.8
                    });
                }
            }["Scene3D.useEffect.onStopClick"];
            stops.forEach({
                "Scene3D.useEffect": (el_1)=>el_1.addEventListener('click', onStopClick)
            }["Scene3D.useEffect"]);
            const onPointer = {
                "Scene3D.useEffect.onPointer": (e_0)=>{
                    if (e_0.pointerType === 'touch' || !instance) return;
                    instance.setPointer(e_0.clientX / window.innerWidth - 0.5, e_0.clientY / window.innerHeight - 0.5);
                }
            }["Scene3D.useEffect.onPointer"];
            ({
                "Scene3D.useEffect": async ()=>{
                    try {
                        const [{ createWorld }, loaded] = await Promise.all([
                            WORLDS[world](),
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$motion$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["loadMotion"])()
                        ]);
                        if (disposed) return;
                        motion = loaded;
                        instance = createWorld(canvas, {
                            labels,
                            onReady: {
                                "Scene3D.useEffect": ()=>section.classList.add('is-ready')
                            }["Scene3D.useEffect"]
                        });
                        if (!instance) throw new Error('WebGL indisponível');
                        section.classList.add('is-live');
                        trigger = motion.ScrollTrigger.create({
                            trigger: section,
                            start: 'top top',
                            end: 'bottom bottom',
                            onUpdate: {
                                "Scene3D.useEffect": (self)=>{
                                    instance.setProgress(self.progress);
                                    showBeat(self.progress);
                                    // Na saída, o texto do palco some no ritmo da cortina que sobe por cima
                                    if (outro) section.style.setProperty('--outro', Math.min(Math.max(self.progress * total - last, 0), outro) / outro);
                                }
                            }["Scene3D.useEffect"]
                        });
                        // A altura muda quando a cena fica viva: os outros gatilhos precisam medir de novo
                        motion.ScrollTrigger.refresh();
                        instance.setProgress(trigger.progress);
                        showBeat(trigger.progress);
                        window.addEventListener('pointermove', onPointer, {
                            passive: true
                        });
                        removeStops = motion.addStops({
                            "Scene3D.useEffect": ()=>Array.from({
                                    length: total + 1
                                }, {
                                    "Scene3D.useEffect": (_, k_0)=>yAt(k_0)
                                }["Scene3D.useEffect"])
                        }["Scene3D.useEffect"]);
                    } catch  {
                        section.classList.remove('is-live');
                        section.classList.add('is-rest');
                    }
                }
            })["Scene3D.useEffect"]();
            return ({
                "Scene3D.useEffect": ()=>{
                    disposed = true;
                    stops.forEach({
                        "Scene3D.useEffect": (el_2)=>el_2.removeEventListener('click', onStopClick)
                    }["Scene3D.useEffect"]);
                    window.removeEventListener('pointermove', onPointer);
                    removeStops?.();
                    trigger?.kill();
                    instance?.dispose();
                }
            })["Scene3D.useEffect"];
        }
    }["Scene3D.useEffect"], [
        world,
        labels,
        outro
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
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
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "scene3d-stage",
            children: [
                backdrop && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "scene3d-backdrop",
                    children: backdrop
                }, void 0, false, {
                    fileName: "[project]/src/components/scene-3d.jsx",
                    lineNumber: 135,
                    columnNumber: 30
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                    className: "scene3d-canvas",
                    ref: canvasRef,
                    "aria-hidden": "true"
                }, void 0, false, {
                    fileName: "[project]/src/components/scene-3d.jsx",
                    lineNumber: 136,
                    columnNumber: 17
                }, this),
                header,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "scene3d-beats",
                    children: children
                }, void 0, false, {
                    fileName: "[project]/src/components/scene-3d.jsx",
                    lineNumber: 138,
                    columnNumber: 17
                }, this),
                route && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                    className: "scene3d-route",
                    "aria-label": routeLabel,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                        children: route.map((stop, i_2)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: `#stop-${stop.id}`,
                                    "aria-current": i_2 === 0 ? 'step' : undefined,
                                    children: stop.name
                                }, void 0, false, {
                                    fileName: "[project]/src/components/scene-3d.jsx",
                                    lineNumber: 142,
                                    columnNumber: 37
                                }, this)
                            }, stop.id, false, {
                                fileName: "[project]/src/components/scene-3d.jsx",
                                lineNumber: 141,
                                columnNumber: 55
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/scene-3d.jsx",
                        lineNumber: 140,
                        columnNumber: 25
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/scene-3d.jsx",
                    lineNumber: 139,
                    columnNumber: 27
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/scene-3d.jsx",
            lineNumber: 134,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/scene-3d.jsx",
        lineNumber: 130,
        columnNumber: 10
    }, this);
}
_s(Scene3D, "s0Rj/SQRZd9YyRthJ2GcDTIgMLI=");
_c = Scene3D;
var _c;
__turbopack_context__.k.register(_c, "Scene3D");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/ThemeToggle.jsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ThemeToggle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$ThemeContext$2e$jsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/ThemeContext.jsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/moon.js [app-client] (ecmascript) <export default as Moon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sun.js [app-client] (ecmascript) <export default as Sun>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function ThemeToggle(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(7);
    if ($[0] !== "04284c3a06de29999fd08c0c905ba557d265eb92a189df5db5c98bdd6ff34f20") {
        for(let $i = 0; $i < 7; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "04284c3a06de29999fd08c0c905ba557d265eb92a189df5db5c98bdd6ff34f20";
    }
    const { labels } = t0;
    const { theme, toggleTheme } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$ThemeContext$2e$jsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"])();
    const label = theme === "dark" ? labels.themeLight : labels.themeDark;
    let t1;
    if ($[1] !== theme) {
        t1 = theme === "dark" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"], {
            size: 18,
            "aria-hidden": "true"
        }, void 0, false, {
            fileName: "[project]/src/components/ui/ThemeToggle.jsx",
            lineNumber: 24,
            columnNumber: 29
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"], {
            size: 18,
            "aria-hidden": "true"
        }, void 0, false, {
            fileName: "[project]/src/components/ui/ThemeToggle.jsx",
            lineNumber: 24,
            columnNumber: 68
        }, this);
        $[1] = theme;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    let t2;
    if ($[3] !== label || $[4] !== t1 || $[5] !== toggleTheme) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            onClick: toggleTheme,
            className: "tool",
            "aria-label": label,
            title: label,
            children: t1
        }, void 0, false, {
            fileName: "[project]/src/components/ui/ThemeToggle.jsx",
            lineNumber: 32,
            columnNumber: 10
        }, this);
        $[3] = label;
        $[4] = t1;
        $[5] = toggleTheme;
        $[6] = t2;
    } else {
        t2 = $[6];
    }
    return t2;
}
_s(ThemeToggle, "CilUWNPHcYH8OXlKfkLwmo6jCCs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$ThemeContext$2e$jsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"]
    ];
});
_c = ThemeToggle;
var _c;
__turbopack_context__.k.register(_c, "ThemeToggle");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/LanguagePicker.jsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LanguagePicker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function LanguagePicker(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(10);
    if ($[0] !== "0999b76b73b7a6a2f7e629a85bfb7819ec0698da524de7053307c70ec24241b8") {
        for(let $i = 0; $i < 10; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "0999b76b73b7a6a2f7e629a85bfb7819ec0698da524de7053307c70ec24241b8";
    }
    const { lang, labels } = t0;
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    let t1;
    if ($[1] !== pathname) {
        t1 = ({
            "LanguagePicker[redirectedPathname]": (locale)=>{
                if (!pathname) {
                    return `/${locale}`;
                }
                const segments = pathname.split("/");
                segments[1] = locale;
                return segments.join("/");
            }
        })["LanguagePicker[redirectedPathname]"];
        $[1] = pathname;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    const redirectedPathname = t1;
    const t2 = lang === "pt" ? "en" : "pt";
    let t3;
    if ($[3] !== redirectedPathname || $[4] !== t2) {
        t3 = redirectedPathname(t2);
        $[3] = redirectedPathname;
        $[4] = t2;
        $[5] = t3;
    } else {
        t3 = $[5];
    }
    let t4;
    if ($[6] !== labels.langShort || $[7] !== labels.switchLang || $[8] !== t3) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            href: t3,
            className: "tool",
            "aria-label": labels.switchLang,
            title: labels.switchLang,
            children: labels.langShort
        }, void 0, false, {
            fileName: "[project]/src/components/ui/LanguagePicker.jsx",
            lineNumber: 49,
            columnNumber: 10
        }, this);
        $[6] = labels.langShort;
        $[7] = labels.switchLang;
        $[8] = t3;
        $[9] = t4;
    } else {
        t4 = $[9];
    }
    return t4;
}
_s(LanguagePicker, "xbyQPtUVMO7MNj7WjJlpdWqRcTo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = LanguagePicker;
var _c;
__turbopack_context__.k.register(_c, "LanguagePicker");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/sections/work.jsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Work
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
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
function ProjectMedia(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(27);
    if ($[0] !== "002c13bd5087df2d2c76465c6a53d507f456fbdc32d560a220ad733db9f468f0") {
        for(let $i = 0; $i < 27; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "002c13bd5087df2d2c76465c6a53d507f456fbdc32d560a220ad733db9f468f0";
    }
    const { project, dict, lazy: t1 } = t0;
    const lazy = t1 === undefined ? true : t1;
    if (project.id === "emove") {
        let t2;
        if ($[1] !== project.alt) {
            t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
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
                lineNumber: 32,
                columnNumber: 12
            }, this);
            $[1] = project.alt;
            $[2] = t2;
        } else {
            t2 = $[2];
        }
        return t2;
    }
    if (project.id === "atoll") {
        let t2;
        if ($[3] !== project.alt) {
            t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "media-logo",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    src: "/images/work/atoll.png",
                    alt: project.alt,
                    width: "512",
                    height: "512",
                    loading: "lazy"
                }, void 0, false, {
                    fileName: "[project]/src/components/sections/work.jsx",
                    lineNumber: 43,
                    columnNumber: 40
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 43,
                columnNumber: 12
            }, this);
            $[3] = project.alt;
            $[4] = t2;
        } else {
            t2 = $[4];
        }
        return t2;
    }
    if (project.id === "triagem") {
        const t2 = project.alt;
        let t3;
        if ($[5] !== dict.triage) {
            t3 = dict.triage.map(_ProjectMediaDictTriageMap);
            $[5] = dict.triage;
            $[6] = t3;
        } else {
            t3 = $[6];
        }
        let t4;
        if ($[7] !== project.alt || $[8] !== t3) {
            t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "ui-chat",
                "data-ui": true,
                role: "img",
                "aria-label": t2,
                children: t3
            }, void 0, false, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 63,
                columnNumber: 12
            }, this);
            $[7] = project.alt;
            $[8] = t3;
            $[9] = t4;
        } else {
            t4 = $[9];
        }
        return t4;
    }
    if (project.id === "notch") {
        let t2;
        if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
            t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "ui-notch-bar"
            }, void 0, false, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 75,
                columnNumber: 12
            }, this);
            $[10] = t2;
        } else {
            t2 = $[10];
        }
        let t3;
        if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
            t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "ui-notch-art"
            }, void 0, false, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 82,
                columnNumber: 12
            }, this);
            $[11] = t3;
        } else {
            t3 = $[11];
        }
        let t4;
        if ($[12] !== dict.notchSong) {
            t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                children: dict.notchSong
            }, void 0, false, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 89,
                columnNumber: 12
            }, this);
            $[12] = dict.notchSong;
            $[13] = t4;
        } else {
            t4 = $[13];
        }
        let t5;
        if ($[14] !== dict.notchArtist || $[15] !== t4) {
            t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: [
                    t4,
                    dict.notchArtist
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 97,
                columnNumber: 12
            }, this);
            $[14] = dict.notchArtist;
            $[15] = t4;
            $[16] = t5;
        } else {
            t5 = $[16];
        }
        let t6;
        if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
            t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "ui-notch-wave",
                "aria-hidden": "true",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                        fileName: "[project]/src/components/sections/work.jsx",
                        lineNumber: 106,
                        columnNumber: 63
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                        fileName: "[project]/src/components/sections/work.jsx",
                        lineNumber: 106,
                        columnNumber: 68
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                        fileName: "[project]/src/components/sections/work.jsx",
                        lineNumber: 106,
                        columnNumber: 73
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                        fileName: "[project]/src/components/sections/work.jsx",
                        lineNumber: 106,
                        columnNumber: 78
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 106,
                columnNumber: 12
            }, this);
            $[17] = t6;
        } else {
            t6 = $[17];
        }
        let t7;
        if ($[18] !== t5) {
            t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "ui-notch-island",
                children: [
                    t3,
                    t5,
                    t6
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 113,
                columnNumber: 12
            }, this);
            $[18] = t5;
            $[19] = t7;
        } else {
            t7 = $[19];
        }
        let t8;
        if ($[20] !== project.alt || $[21] !== t7) {
            t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "ui-notch",
                "data-ui": true,
                role: "img",
                "aria-label": project.alt,
                children: [
                    t2,
                    t7
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 121,
                columnNumber: 12
            }, this);
            $[20] = project.alt;
            $[21] = t7;
            $[22] = t8;
        } else {
            t8 = $[22];
        }
        return t8;
    }
    const t2 = IMAGES[project.id];
    const t3 = lazy ? "lazy" : "eager";
    let t4;
    if ($[23] !== project.alt || $[24] !== t2 || $[25] !== t3) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
            src: t2,
            alt: project.alt,
            width: "1600",
            height: "1000",
            loading: t3
        }, void 0, false, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 134,
            columnNumber: 10
        }, this);
        $[23] = project.alt;
        $[24] = t2;
        $[25] = t3;
        $[26] = t4;
    } else {
        t4 = $[26];
    }
    return t4;
}
_c = ProjectMedia;
function _ProjectMediaDictTriageMap(row) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "ui-chat-row",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "ui-chat-msg",
                children: row.msg
            }, void 0, false, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 145,
                columnNumber: 53
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "ui-chat-tag",
                children: row.label
            }, void 0, false, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 145,
                columnNumber: 99
            }, this)
        ]
    }, row.msg, true, {
        fileName: "[project]/src/components/sections/work.jsx",
        lineNumber: 145,
        columnNumber: 10
    }, this);
}
function ProjectDetail(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(27);
    if ($[0] !== "002c13bd5087df2d2c76465c6a53d507f456fbdc32d560a220ad733db9f468f0") {
        for(let $i = 0; $i < 27; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "002c13bd5087df2d2c76465c6a53d507f456fbdc32d560a220ad733db9f468f0";
    }
    const { project, dict, lang } = t0;
    const page = PAGES[project.id];
    let t1;
    if ($[1] !== project.desc) {
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            children: project.desc
        }, void 0, false, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 163,
            columnNumber: 10
        }, this);
        $[1] = project.desc;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    let t2;
    if ($[3] !== project.stack) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "stack",
            children: project.stack
        }, void 0, false, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 171,
            columnNumber: 10
        }, this);
        $[3] = project.stack;
        $[4] = t2;
    } else {
        t2 = $[4];
    }
    let t3;
    if ($[5] !== dict || $[6] !== lang || $[7] !== page) {
        t3 = page && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
            href: `/${lang}/${page}`,
            className: "button",
            children: dict.inside
        }, void 0, false, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 179,
            columnNumber: 18
        }, this);
        $[5] = dict;
        $[6] = lang;
        $[7] = page;
        $[8] = t3;
    } else {
        t3 = $[8];
    }
    let t4;
    if ($[9] !== dict || $[10] !== project.code) {
        t4 = project.code && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
            href: project.code,
            target: "_blank",
            rel: "noopener noreferrer",
            children: dict.code
        }, void 0, false, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 189,
            columnNumber: 26
        }, this);
        $[9] = dict;
        $[10] = project.code;
        $[11] = t4;
    } else {
        t4 = $[11];
    }
    let t5;
    if ($[12] !== dict || $[13] !== project.demo) {
        t5 = project.demo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
            href: project.demo,
            target: "_blank",
            rel: "noopener noreferrer",
            children: dict.demo
        }, void 0, false, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 198,
            columnNumber: 26
        }, this);
        $[12] = dict;
        $[13] = project.demo;
        $[14] = t5;
    } else {
        t5 = $[14];
    }
    let t6;
    if ($[15] !== dict || $[16] !== project.code) {
        t6 = !project.code && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "private",
            children: dict.private
        }, void 0, false, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 207,
            columnNumber: 27
        }, this);
        $[15] = dict;
        $[16] = project.code;
        $[17] = t6;
    } else {
        t6 = $[17];
    }
    let t7;
    if ($[18] !== t3 || $[19] !== t4 || $[20] !== t5 || $[21] !== t6) {
        t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "work-links",
            children: [
                t3,
                t4,
                t5,
                t6
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 216,
            columnNumber: 10
        }, this);
        $[18] = t3;
        $[19] = t4;
        $[20] = t5;
        $[21] = t6;
        $[22] = t7;
    } else {
        t7 = $[22];
    }
    let t8;
    if ($[23] !== t1 || $[24] !== t2 || $[25] !== t7) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "work-detail",
            children: [
                t1,
                t2,
                t7
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 227,
            columnNumber: 10
        }, this);
        $[23] = t1;
        $[24] = t2;
        $[25] = t7;
        $[26] = t8;
    } else {
        t8 = $[26];
    }
    return t8;
}
_c1 = ProjectDetail;
function Work(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(36);
    if ($[0] !== "002c13bd5087df2d2c76465c6a53d507f456fbdc32d560a220ad733db9f468f0") {
        for(let $i = 0; $i < 36; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "002c13bd5087df2d2c76465c6a53d507f456fbdc32d560a220ad733db9f468f0";
    }
    const { dict, lang } = t0;
    const projects = dict.projects;
    const [active, setActive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const asideRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const sectionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    let t1;
    let t2;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = ({
            "Work[useEffect()]": ()=>{
                const section = sectionRef.current;
                const aside = asideRef.current;
                if (!section || !aside) {
                    return;
                }
                if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                    return;
                }
                let frame = 0;
                const update = {
                    "Work[useEffect() > update]": ()=>{
                        frame = 0;
                        const rect = section.getBoundingClientRect();
                        const progress = Math.min(Math.max(-rect.top / Math.max(rect.height - window.innerHeight, 1), 0), 1);
                        aside.style.setProperty("--fy", `${-22 + progress * 18}deg`);
                        aside.style.setProperty("--fx", `${7 - progress * 5}deg`);
                    }
                }["Work[useEffect() > update]"];
                const onScroll = {
                    "Work[useEffect() > onScroll]": ()=>{
                        if (!frame) {
                            frame = requestAnimationFrame(update);
                        }
                    }
                }["Work[useEffect() > onScroll]"];
                update();
                window.addEventListener("scroll", onScroll, {
                    passive: true
                });
                return ()=>{
                    window.removeEventListener("scroll", onScroll);
                    cancelAnimationFrame(frame);
                };
            }
        })["Work[useEffect()]"];
        t2 = [];
        $[1] = t1;
        $[2] = t2;
    } else {
        t1 = $[1];
        t2 = $[2];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])(t1, t2);
    const current = projects[active];
    let t3;
    if ($[3] !== dict.title) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
            id: "projects-title",
            className: "lead",
            "data-reveal": true,
            children: dict.title
        }, void 0, false, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 304,
            columnNumber: 10
        }, this);
        $[3] = dict.title;
        $[4] = t3;
    } else {
        t3 = $[4];
    }
    let t4;
    if ($[5] !== active || $[6] !== dict || $[7] !== lang || $[8] !== projects) {
        let t5;
        if ($[10] !== active || $[11] !== dict || $[12] !== lang) {
            t5 = ({
                "Work[projects.map()]": (project, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        "data-reveal": true,
                        style: {
                            "--i": i
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "work-mobile",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "media-shot",
                                    "data-project": project.id,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProjectMedia, {
                                        project: project,
                                        dict: dict
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/work.jsx",
                                        lineNumber: 317,
                                        columnNumber: 95
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/work.jsx",
                                    lineNumber: 317,
                                    columnNumber: 41
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/work.jsx",
                                lineNumber: 317,
                                columnNumber: 12
                            }, this),
                            PAGES[project.id] ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: `/${lang}/${PAGES[project.id]}`,
                                className: "work-name",
                                "aria-current": i === active ? "true" : undefined,
                                onPointerEnter: {
                                    "Work[projects.map() > <a>.onPointerEnter]": ()=>setActive(i)
                                }["Work[projects.map() > <a>.onPointerEnter]"],
                                onFocus: {
                                    "Work[projects.map() > <a>.onFocus]": ()=>setActive(i)
                                }["Work[projects.map() > <a>.onFocus]"],
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: project.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/work.jsx",
                                        lineNumber: 321,
                                        columnNumber: 52
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            project.meta,
                                            ", ",
                                            project.year
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/sections/work.jsx",
                                        lineNumber: 321,
                                        columnNumber: 83
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/sections/work.jsx",
                                lineNumber: 317,
                                columnNumber: 174
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "work-name",
                                "aria-pressed": i === active,
                                onClick: {
                                    "Work[projects.map() > <button>.onClick]": ()=>setActive(i)
                                }["Work[projects.map() > <button>.onClick]"],
                                onPointerEnter: {
                                    "Work[projects.map() > <button>.onPointerEnter]": ()=>setActive(i)
                                }["Work[projects.map() > <button>.onPointerEnter]"],
                                onFocus: {
                                    "Work[projects.map() > <button>.onFocus]": ()=>setActive(i)
                                }["Work[projects.map() > <button>.onFocus]"],
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: project.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/sections/work.jsx",
                                        lineNumber: 327,
                                        columnNumber: 57
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            project.meta,
                                            ", ",
                                            project.year
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/sections/work.jsx",
                                        lineNumber: 327,
                                        columnNumber: 88
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/sections/work.jsx",
                                lineNumber: 321,
                                columnNumber: 133
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "work-mobile",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProjectDetail, {
                                    project: project,
                                    dict: dict,
                                    lang: lang
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/work.jsx",
                                    lineNumber: 327,
                                    columnNumber: 170
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/work.jsx",
                                lineNumber: 327,
                                columnNumber: 141
                            }, this)
                        ]
                    }, project.id, true, {
                        fileName: "[project]/src/components/sections/work.jsx",
                        lineNumber: 315,
                        columnNumber: 49
                    }, this)
            })["Work[projects.map()]"];
            $[10] = active;
            $[11] = dict;
            $[12] = lang;
            $[13] = t5;
        } else {
            t5 = $[13];
        }
        t4 = projects.map(t5);
        $[5] = active;
        $[6] = dict;
        $[7] = lang;
        $[8] = projects;
        $[9] = t4;
    } else {
        t4 = $[9];
    }
    let t5;
    if ($[14] !== t4) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
            className: "work-list",
            children: t4
        }, void 0, false, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 347,
            columnNumber: 10
        }, this);
        $[14] = t4;
        $[15] = t5;
    } else {
        t5 = $[15];
    }
    let t6;
    if ($[16] !== active || $[17] !== dict || $[18] !== projects) {
        let t7;
        if ($[20] !== active || $[21] !== dict) {
            t7 = ({
                "Work[projects.map()]": (project_0, i_0)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `frame-item${i_0 === active ? " is-active" : ""}${i_0 < active ? " is-before" : ""}`,
                        "data-project": project_0.id,
                        "aria-hidden": i_0 !== active,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProjectMedia, {
                            project: project_0,
                            dict: dict,
                            lazy: i_0 !== 0
                        }, void 0, false, {
                            fileName: "[project]/src/components/sections/work.jsx",
                            lineNumber: 358,
                            columnNumber: 231
                        }, this)
                    }, project_0.id, false, {
                        fileName: "[project]/src/components/sections/work.jsx",
                        lineNumber: 358,
                        columnNumber: 53
                    }, this)
            })["Work[projects.map()]"];
            $[20] = active;
            $[21] = dict;
            $[22] = t7;
        } else {
            t7 = $[22];
        }
        t6 = projects.map(t7);
        $[16] = active;
        $[17] = dict;
        $[18] = projects;
        $[19] = t6;
    } else {
        t6 = $[19];
    }
    let t7;
    if ($[23] !== t6) {
        t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "frame3d",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "frame-rig",
                children: t6
            }, void 0, false, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 376,
                columnNumber: 35
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 376,
            columnNumber: 10
        }, this);
        $[23] = t6;
        $[24] = t7;
    } else {
        t7 = $[24];
    }
    let t8;
    if ($[25] !== current || $[26] !== dict || $[27] !== lang) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            "aria-live": "polite",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProjectDetail, {
                project: current,
                dict: dict,
                lang: lang
            }, void 0, false, {
                fileName: "[project]/src/components/sections/work.jsx",
                lineNumber: 384,
                columnNumber: 34
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 384,
            columnNumber: 10
        }, this);
        $[25] = current;
        $[26] = dict;
        $[27] = lang;
        $[28] = t8;
    } else {
        t8 = $[28];
    }
    let t9;
    if ($[29] !== t7 || $[30] !== t8) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "work-aside",
            ref: asideRef,
            children: [
                t7,
                t8
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 394,
            columnNumber: 10
        }, this);
        $[29] = t7;
        $[30] = t8;
        $[31] = t9;
    } else {
        t9 = $[31];
    }
    let t10;
    if ($[32] !== t3 || $[33] !== t5 || $[34] !== t9) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            id: "projects",
            className: "work",
            "data-slide": true,
            ref: sectionRef,
            "aria-labelledby": "projects-title",
            children: [
                t3,
                t5,
                t9
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/sections/work.jsx",
            lineNumber: 403,
            columnNumber: 11
        }, this);
        $[32] = t3;
        $[33] = t5;
        $[34] = t9;
        $[35] = t10;
    } else {
        t10 = $[35];
    }
    return t10;
}
_s(Work, "LkZrEgEn83vNrwfYu/+Xu25fU1U=");
_c2 = Work;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "ProjectMedia");
__turbopack_context__.k.register(_c1, "ProjectDetail");
__turbopack_context__.k.register(_c2, "Work");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/sections/journey.jsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Journey
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
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
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(2);
    if ($[0] !== "a661f1662cc308b2a15ba50d90061a45f89160dd8a1d0ab6394893da250a33fa") {
        for(let $i = 0; $i < 2; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "a661f1662cc308b2a15ba50d90061a45f89160dd8a1d0ab6394893da250a33fa";
    }
    let t0;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        const now = new Date();
        t0 = SEMESTER_STARTS.filter({
            "useCurrentSemester[SEMESTER_STARTS.filter()]": (d)=>new Date(d) <= now
        }["useCurrentSemester[SEMESTER_STARTS.filter()]"]);
        $[1] = t0;
    } else {
        t0 = $[1];
    }
    const started = t0.length;
    return Math.min(Math.max(started, 1), TOTAL_SEMS);
}
function Journey(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(19);
    if ($[0] !== "a661f1662cc308b2a15ba50d90061a45f89160dd8a1d0ab6394893da250a33fa") {
        for(let $i = 0; $i < 19; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "a661f1662cc308b2a15ba50d90061a45f89160dd8a1d0ab6394893da250a33fa";
    }
    const { dict } = t0;
    const semester = useCurrentSemester();
    let t1;
    if ($[1] !== dict.title) {
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
            id: "journey-title",
            children: dict.title
        }, void 0, false, {
            fileName: "[project]/src/components/sections/journey.jsx",
            lineNumber: 44,
            columnNumber: 10
        }, this);
        $[1] = dict.title;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    let t2;
    if ($[3] !== dict.note) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "journey-note",
            children: dict.note
        }, void 0, false, {
            fileName: "[project]/src/components/sections/journey.jsx",
            lineNumber: 52,
            columnNumber: 10
        }, this);
        $[3] = dict.note;
        $[4] = t2;
    } else {
        t2 = $[4];
    }
    let t3;
    if ($[5] !== dict.groups || $[6] !== semester) {
        let t4;
        if ($[8] !== semester) {
            t4 = ({
                "Journey[dict.groups.map()]": (group)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "journey-group",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: group.name
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/journey.jsx",
                                lineNumber: 63,
                                columnNumber: 96
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                children: group.items.map({
                                    "Journey[dict.groups.map() > group.items.map()]": (item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "journey-row",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: item.name
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/sections/journey.jsx",
                                                            lineNumber: 64,
                                                            columnNumber: 122
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: item.when
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/sections/journey.jsx",
                                                            lineNumber: 64,
                                                            columnNumber: 146
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/sections/journey.jsx",
                                                    lineNumber: 64,
                                                    columnNumber: 93
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "journey-desc",
                                                    children: item.desc.replace("{n}", semester).replace("{total}", TOTAL_SEMS)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/sections/journey.jsx",
                                                    lineNumber: 64,
                                                    columnNumber: 176
                                                }, this)
                                            ]
                                        }, item.name, true, {
                                            fileName: "[project]/src/components/sections/journey.jsx",
                                            lineNumber: 64,
                                            columnNumber: 73
                                        }, this)
                                }["Journey[dict.groups.map() > group.items.map()]"])
                            }, void 0, false, {
                                fileName: "[project]/src/components/sections/journey.jsx",
                                lineNumber: 63,
                                columnNumber: 117
                            }, this)
                        ]
                    }, group.name, true, {
                        fileName: "[project]/src/components/sections/journey.jsx",
                        lineNumber: 63,
                        columnNumber: 48
                    }, this)
            })["Journey[dict.groups.map()]"];
            $[8] = semester;
            $[9] = t4;
        } else {
            t4 = $[9];
        }
        t3 = dict.groups.map(t4);
        $[5] = dict.groups;
        $[6] = semester;
        $[7] = t3;
    } else {
        t3 = $[7];
    }
    let t4;
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
            fileName: "[project]/src/components/sections/journey.jsx",
            lineNumber: 81,
            columnNumber: 10
        }, this);
        $[10] = t4;
    } else {
        t4 = $[10];
    }
    let t5;
    if ($[11] !== dict.closing[0] || $[12] !== dict.closing[1]) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "journey-closing",
            children: [
                dict.closing[0],
                t4,
                dict.closing[1]
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/sections/journey.jsx",
            lineNumber: 88,
            columnNumber: 10
        }, this);
        $[11] = dict.closing[0];
        $[12] = dict.closing[1];
        $[13] = t5;
    } else {
        t5 = $[13];
    }
    let t6;
    if ($[14] !== t1 || $[15] !== t2 || $[16] !== t3 || $[17] !== t5) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            id: "journey",
            className: "journey",
            "data-slide": true,
            "aria-labelledby": "journey-title",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "journey-sheet",
                "data-reveal": true,
                children: [
                    t1,
                    t2,
                    t3,
                    t5
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/sections/journey.jsx",
                lineNumber: 97,
                columnNumber: 102
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/sections/journey.jsx",
            lineNumber: 97,
            columnNumber: 10
        }, this);
        $[14] = t1;
        $[15] = t2;
        $[16] = t3;
        $[17] = t5;
        $[18] = t6;
    } else {
        t6 = $[18];
    }
    return t6;
}
_s(Journey, "yMbVqUadIHJyPQF/EUamrbynuh8=", false, function() {
    return [
        useCurrentSemester
    ];
});
_c = Journey;
var _c;
__turbopack_context__.k.register(_c, "Journey");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/sections/contact.jsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Contact
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.js [app-client] (ecmascript) <export default as ArrowRight>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
const EMAIL = 'fgiacominicocco@gmail.com';
function Contact(t0) {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(47);
    if ($[0] !== "4fd294ee0ff69961734f70f01c290d08517c15d27cf9464727d31105d3009e12") {
        for(let $i = 0; $i < 47; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "4fd294ee0ff69961734f70f01c290d08517c15d27cf9464727d31105d3009e12";
    }
    const { dict } = t0;
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(dict.subject)}&body=${encodeURIComponent(message)}`;
    let t1;
    if ($[1] !== mailto) {
        t1 = ({
            "Contact[handleSubmit]": (e)=>{
                e.preventDefault();
                window.location.href = mailto;
            }
        })["Contact[handleSubmit]"];
        $[1] = mailto;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    const handleSubmit = t1;
    let t2;
    if ($[3] !== dict.line1) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            children: dict.line1
        }, void 0, false, {
            fileName: "[project]/src/components/sections/contact.jsx",
            lineNumber: 36,
            columnNumber: 10
        }, this);
        $[3] = dict.line1;
        $[4] = t2;
    } else {
        t2 = $[4];
    }
    let t3;
    if ($[5] !== dict.line2) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            children: dict.line2
        }, void 0, false, {
            fileName: "[project]/src/components/sections/contact.jsx",
            lineNumber: 44,
            columnNumber: 10
        }, this);
        $[5] = dict.line2;
        $[6] = t3;
    } else {
        t3 = $[6];
    }
    let t4;
    if ($[7] !== t2 || $[8] !== t3) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
            id: "contact-title",
            className: "lead",
            "data-reveal": true,
            children: [
                t2,
                t3
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/sections/contact.jsx",
            lineNumber: 52,
            columnNumber: 10
        }, this);
        $[7] = t2;
        $[8] = t3;
        $[9] = t4;
    } else {
        t4 = $[9];
    }
    let t5;
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = {
            "--i": 1
        };
        $[10] = t5;
    } else {
        t5 = $[10];
    }
    let t6;
    if ($[11] !== dict.placeholder) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "visually-hidden",
            htmlFor: "contact-message",
            children: dict.placeholder
        }, void 0, false, {
            fileName: "[project]/src/components/sections/contact.jsx",
            lineNumber: 70,
            columnNumber: 10
        }, this);
        $[11] = dict.placeholder;
        $[12] = t6;
    } else {
        t6 = $[12];
    }
    let t7;
    if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
        t7 = ({
            "Contact[<input>.onChange]": (e_0)=>setMessage(e_0.target.value)
        })["Contact[<input>.onChange]"];
        $[13] = t7;
    } else {
        t7 = $[13];
    }
    let t8;
    if ($[14] !== dict.placeholder || $[15] !== message) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            id: "contact-message",
            name: "mensagem",
            type: "text",
            placeholder: dict.placeholder,
            value: message,
            onChange: t7,
            autoComplete: "off"
        }, void 0, false, {
            fileName: "[project]/src/components/sections/contact.jsx",
            lineNumber: 87,
            columnNumber: 10
        }, this);
        $[14] = dict.placeholder;
        $[15] = message;
        $[16] = t8;
    } else {
        t8 = $[16];
    }
    let t9;
    if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {
            size: 20,
            "aria-hidden": "true"
        }, void 0, false, {
            fileName: "[project]/src/components/sections/contact.jsx",
            lineNumber: 96,
            columnNumber: 10
        }, this);
        $[17] = t9;
    } else {
        t9 = $[17];
    }
    let t10;
    if ($[18] !== dict.submit) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "submit",
            className: "button send",
            "aria-label": dict.submit,
            children: t9
        }, void 0, false, {
            fileName: "[project]/src/components/sections/contact.jsx",
            lineNumber: 103,
            columnNumber: 11
        }, this);
        $[18] = dict.submit;
        $[19] = t10;
    } else {
        t10 = $[19];
    }
    let t11;
    if ($[20] !== handleSubmit || $[21] !== t10 || $[22] !== t6 || $[23] !== t8) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
            action: `mailto:${EMAIL}`,
            method: "post",
            encType: "text/plain",
            onSubmit: handleSubmit,
            "data-reveal": true,
            style: t5,
            children: [
                t6,
                t8,
                t10
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/sections/contact.jsx",
            lineNumber: 111,
            columnNumber: 11
        }, this);
        $[20] = handleSubmit;
        $[21] = t10;
        $[22] = t6;
        $[23] = t8;
        $[24] = t11;
    } else {
        t11 = $[24];
    }
    let t12;
    if ($[25] === Symbol.for("react.memo_cache_sentinel")) {
        t12 = {
            "--i": 2
        };
        $[25] = t12;
    } else {
        t12 = $[25];
    }
    let t13;
    if ($[26] !== dict.after) {
        t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "contact-after",
            "data-reveal": true,
            style: t12,
            children: dict.after
        }, void 0, false, {
            fileName: "[project]/src/components/sections/contact.jsx",
            lineNumber: 131,
            columnNumber: 11
        }, this);
        $[26] = dict.after;
        $[27] = t13;
    } else {
        t13 = $[27];
    }
    let t14;
    if ($[28] === Symbol.for("react.memo_cache_sentinel")) {
        t14 = {
            "--i": 3
        };
        $[28] = t14;
    } else {
        t14 = $[28];
    }
    let t15;
    if ($[29] !== dict.email) {
        t15 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
            children: dict.email
        }, void 0, false, {
            fileName: "[project]/src/components/sections/contact.jsx",
            lineNumber: 148,
            columnNumber: 11
        }, this);
        $[29] = dict.email;
        $[30] = t15;
    } else {
        t15 = $[30];
    }
    let t16;
    if ($[31] === Symbol.for("react.memo_cache_sentinel")) {
        t16 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                href: `mailto:${EMAIL}`,
                children: EMAIL
            }, void 0, false, {
                fileName: "[project]/src/components/sections/contact.jsx",
                lineNumber: 156,
                columnNumber: 15
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/sections/contact.jsx",
            lineNumber: 156,
            columnNumber: 11
        }, this);
        $[31] = t16;
    } else {
        t16 = $[31];
    }
    let t17;
    if ($[32] !== dict.linkedin) {
        t17 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
            children: dict.linkedin
        }, void 0, false, {
            fileName: "[project]/src/components/sections/contact.jsx",
            lineNumber: 163,
            columnNumber: 11
        }, this);
        $[32] = dict.linkedin;
        $[33] = t17;
    } else {
        t17 = $[33];
    }
    let t18;
    if ($[34] === Symbol.for("react.memo_cache_sentinel")) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                href: "https://www.linkedin.com/in/felipegcocco/",
                target: "_blank",
                rel: "noopener noreferrer",
                children: "linkedin.com/in/felipegcocco"
            }, void 0, false, {
                fileName: "[project]/src/components/sections/contact.jsx",
                lineNumber: 171,
                columnNumber: 15
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/sections/contact.jsx",
            lineNumber: 171,
            columnNumber: 11
        }, this);
        $[34] = t18;
    } else {
        t18 = $[34];
    }
    let t19;
    if ($[35] !== dict.github) {
        t19 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
            children: dict.github
        }, void 0, false, {
            fileName: "[project]/src/components/sections/contact.jsx",
            lineNumber: 178,
            columnNumber: 11
        }, this);
        $[35] = dict.github;
        $[36] = t19;
    } else {
        t19 = $[36];
    }
    let t20;
    if ($[37] === Symbol.for("react.memo_cache_sentinel")) {
        t20 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                href: "https://github.com/felipegco",
                target: "_blank",
                rel: "noopener noreferrer",
                children: "github.com/felipegco"
            }, void 0, false, {
                fileName: "[project]/src/components/sections/contact.jsx",
                lineNumber: 186,
                columnNumber: 15
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/sections/contact.jsx",
            lineNumber: 186,
            columnNumber: 11
        }, this);
        $[37] = t20;
    } else {
        t20 = $[37];
    }
    let t21;
    if ($[38] !== t15 || $[39] !== t17 || $[40] !== t19) {
        t21 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
            "data-reveal": true,
            style: t14,
            children: [
                t15,
                t16,
                t17,
                t18,
                t19,
                t20
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/sections/contact.jsx",
            lineNumber: 193,
            columnNumber: 11
        }, this);
        $[38] = t15;
        $[39] = t17;
        $[40] = t19;
        $[41] = t21;
    } else {
        t21 = $[41];
    }
    let t22;
    if ($[42] !== t11 || $[43] !== t13 || $[44] !== t21 || $[45] !== t4) {
        t22 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            id: "contact",
            className: "contact",
            "data-slide": true,
            "aria-labelledby": "contact-title",
            children: [
                t4,
                t11,
                t13,
                t21
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/sections/contact.jsx",
            lineNumber: 203,
            columnNumber: 11
        }, this);
        $[42] = t11;
        $[43] = t13;
        $[44] = t21;
        $[45] = t4;
        $[46] = t22;
    } else {
        t22 = $[46];
    }
    return t22;
}
_s(Contact, "EiOGSxO4GWQlH0sM782nQ9JwuAs=");
_c = Contact;
var _c;
__turbopack_context__.k.register(_c, "Contact");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/RevealObserver.jsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RevealObserver
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function RevealObserver() {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(2);
    if ($[0] !== "bd42db0c562128864655e5901daa5085deb1decb86f2c7b64bbb47ad15da9d06") {
        for(let $i = 0; $i < 2; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "bd42db0c562128864655e5901daa5085deb1decb86f2c7b64bbb47ad15da9d06";
    }
    let t0;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = [];
        $[1] = t0;
    } else {
        t0 = $[1];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])(_RevealObserverUseEffect, t0);
    return null;
}
_s(RevealObserver, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c = RevealObserver;
function _RevealObserverUseEffect() {
    const pending = new Set(document.querySelectorAll("[data-reveal]"));
    const reveal = {
        "RevealObserver[useEffect() > reveal]": (el)=>{
            el.classList.add("in");
            pending.delete(el);
            observer.unobserve(el);
        }
    }["RevealObserver[useEffect() > reveal]"];
    const observer = new IntersectionObserver((entries)=>{
        entries.forEach({
            "RevealObserver[useEffect() > <anonymous> > entries.forEach()]": (entry)=>{
                if (entry.isIntersecting) {
                    reveal(entry.target);
                }
            }
        }["RevealObserver[useEffect() > <anonymous> > entries.forEach()]"]);
    }, {
        rootMargin: "0px 0px -8% 0px"
    });
    let frame = 0;
    const catchUp = {
        "RevealObserver[useEffect() > catchUp]": ()=>{
            frame = 0;
            pending.forEach({
                "RevealObserver[useEffect() > catchUp > pending.forEach()]": (el_0)=>{
                    if (el_0.getBoundingClientRect().top < window.innerHeight * 0.92) {
                        reveal(el_0);
                    }
                }
            }["RevealObserver[useEffect() > catchUp > pending.forEach()]"]);
            if (!pending.size) {
                window.removeEventListener("scroll", onScroll);
            }
        }
    }["RevealObserver[useEffect() > catchUp]"];
    const onScroll = {
        "RevealObserver[useEffect() > onScroll]": ()=>{
            if (!frame) {
                frame = requestAnimationFrame(catchUp);
            }
        }
    }["RevealObserver[useEffect() > onScroll]"];
    pending.forEach({
        "RevealObserver[useEffect() > pending.forEach()]": (el_1)=>observer.observe(el_1)
    }["RevealObserver[useEffect() > pending.forEach()]"]);
    window.addEventListener("scroll", onScroll, {
        passive: true
    });
    return ()=>{
        observer.disconnect();
        window.removeEventListener("scroll", onScroll);
        cancelAnimationFrame(frame);
    };
}
var _c;
__turbopack_context__.k.register(_c, "RevealObserver");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/lucide-react/dist/esm/shared/src/utils.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "hasA11yProp",
    ()=>hasA11yProp,
    "mergeClasses",
    ()=>mergeClasses,
    "toCamelCase",
    ()=>toCamelCase,
    "toKebabCase",
    ()=>toKebabCase,
    "toPascalCase",
    ()=>toPascalCase
]);
/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const toKebabCase = (string)=>string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const toCamelCase = (string)=>string.replace(/^([A-Z])|[\s-_]+(\w)/g, (match, p1, p2)=>p2 ? p2.toUpperCase() : p1.toLowerCase());
const toPascalCase = (string)=>{
    const camelCase = toCamelCase(string);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};
const mergeClasses = (...classes)=>classes.filter((className, index, array)=>{
        return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
    }).join(" ").trim();
const hasA11yProp = (props)=>{
    for(const prop in props){
        if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
            return true;
        }
    }
};
;
}),
"[project]/node_modules/lucide-react/dist/esm/defaultAttributes.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>defaultAttributes
]);
/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var defaultAttributes = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
};
;
}),
"[project]/node_modules/lucide-react/dist/esm/Icon.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Icon
]);
/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$defaultAttributes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/defaultAttributes.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/shared/src/utils.js [app-client] (ecmascript)");
;
;
;
const Icon = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(({ color = "currentColor", size = 24, strokeWidth = 2, absoluteStrokeWidth, className = "", children, iconNode, ...rest }, ref)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])("svg", {
        ref,
        ...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$defaultAttributes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"],
        width: size,
        height: size,
        stroke: color,
        strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mergeClasses"])("lucide", className),
        ...!children && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hasA11yProp"])(rest) && {
            "aria-hidden": "true"
        },
        ...rest
    }, [
        ...iconNode.map(([tag, attrs])=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])(tag, attrs)),
        ...Array.isArray(children) ? children : [
            children
        ]
    ]));
;
}),
"[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>createLucideIcon
]);
/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/shared/src/utils.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$Icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/Icon.js [app-client] (ecmascript)");
;
;
;
const createLucideIcon = (iconName, iconNode)=>{
    const Component = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$Icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            ref,
            iconNode,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mergeClasses"])(`lucide-${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toKebabCase"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toPascalCase"])(iconName))}`, `lucide-${iconName}`, className),
            ...props
        }));
    Component.displayName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toPascalCase"])(iconName);
    return Component;
};
;
}),
"[project]/node_modules/lucide-react/dist/esm/icons/moon.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Moon
]);
/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",
            key: "kfwtm"
        }
    ]
];
const Moon = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("moon", __iconNode);
;
}),
"[project]/node_modules/lucide-react/dist/esm/icons/moon.js [app-client] (ecmascript) <export default as Moon>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Moon",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/moon.js [app-client] (ecmascript)");
}),
"[project]/node_modules/lucide-react/dist/esm/icons/sun.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>Sun
]);
/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "circle",
        {
            cx: "12",
            cy: "12",
            r: "4",
            key: "4exip2"
        }
    ],
    [
        "path",
        {
            d: "M12 2v2",
            key: "tus03m"
        }
    ],
    [
        "path",
        {
            d: "M12 20v2",
            key: "1lh1kg"
        }
    ],
    [
        "path",
        {
            d: "m4.93 4.93 1.41 1.41",
            key: "149t6j"
        }
    ],
    [
        "path",
        {
            d: "m17.66 17.66 1.41 1.41",
            key: "ptbguv"
        }
    ],
    [
        "path",
        {
            d: "M2 12h2",
            key: "1t8f8n"
        }
    ],
    [
        "path",
        {
            d: "M20 12h2",
            key: "1q8mjw"
        }
    ],
    [
        "path",
        {
            d: "m6.34 17.66-1.41 1.41",
            key: "1m8zz5"
        }
    ],
    [
        "path",
        {
            d: "m19.07 4.93-1.41 1.41",
            key: "1shlcs"
        }
    ]
];
const Sun = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("sun", __iconNode);
;
}),
"[project]/node_modules/lucide-react/dist/esm/icons/sun.js [app-client] (ecmascript) <export default as Sun>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Sun",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sun.js [app-client] (ecmascript)");
}),
"[project]/node_modules/next/dist/shared/lib/router/utils/querystring.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    assign: null,
    searchParamsToUrlQuery: null,
    urlQueryToSearchParams: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    assign: function() {
        return assign;
    },
    searchParamsToUrlQuery: function() {
        return searchParamsToUrlQuery;
    },
    urlQueryToSearchParams: function() {
        return urlQueryToSearchParams;
    }
});
function searchParamsToUrlQuery(searchParams) {
    const query = {};
    for (const [key, value] of searchParams.entries()){
        const existing = query[key];
        if (typeof existing === 'undefined') {
            query[key] = value;
        } else if (Array.isArray(existing)) {
            existing.push(value);
        } else {
            query[key] = [
                existing,
                value
            ];
        }
    }
    return query;
}
function stringifyUrlQueryParam(param) {
    if (typeof param === 'string') {
        return param;
    }
    if (typeof param === 'number' && !isNaN(param) || typeof param === 'boolean') {
        return String(param);
    } else {
        return '';
    }
}
function urlQueryToSearchParams(query) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query)){
        if (Array.isArray(value)) {
            for (const item of value){
                searchParams.append(key, stringifyUrlQueryParam(item));
            }
        } else {
            searchParams.set(key, stringifyUrlQueryParam(value));
        }
    }
    return searchParams;
}
function assign(target, ...searchParamsList) {
    for (const searchParams of searchParamsList){
        for (const key of searchParams.keys()){
            target.delete(key);
        }
        for (const [key, value] of searchParams.entries()){
            target.append(key, value);
        }
    }
    return target;
}
}),
"[project]/node_modules/next/dist/shared/lib/router/utils/format-url.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
// Format function modified from nodejs
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    formatUrl: null,
    formatWithValidation: null,
    urlObjectKeys: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    formatUrl: function() {
        return formatUrl;
    },
    formatWithValidation: function() {
        return formatWithValidation;
    },
    urlObjectKeys: function() {
        return urlObjectKeys;
    }
});
const _interop_require_wildcard = __turbopack_context__.r("[project]/node_modules/@swc/helpers/cjs/_interop_require_wildcard.cjs [app-client] (ecmascript)");
const _querystring = /*#__PURE__*/ _interop_require_wildcard._(__turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/router/utils/querystring.js [app-client] (ecmascript)"));
const slashedProtocols = /https?|ftp|gopher|file/;
function formatUrl(urlObj) {
    let { auth, hostname } = urlObj;
    let protocol = urlObj.protocol || '';
    let pathname = urlObj.pathname || '';
    let hash = urlObj.hash || '';
    let query = urlObj.query || '';
    let host = false;
    auth = auth ? encodeURIComponent(auth).replace(/%3A/i, ':') + '@' : '';
    if (urlObj.host) {
        host = auth + urlObj.host;
    } else if (hostname) {
        host = auth + (~hostname.indexOf(':') ? `[${hostname}]` : hostname);
        if (urlObj.port) {
            host += ':' + urlObj.port;
        }
    }
    if (query && typeof query === 'object') {
        query = String(_querystring.urlQueryToSearchParams(query));
    }
    let search = urlObj.search || query && `?${query}` || '';
    if (protocol && !protocol.endsWith(':')) protocol += ':';
    if (urlObj.slashes || (!protocol || slashedProtocols.test(protocol)) && host !== false) {
        host = '//' + (host || '');
        if (pathname && pathname[0] !== '/') pathname = '/' + pathname;
    } else if (!host) {
        host = '';
    }
    if (hash && hash[0] !== '#') hash = '#' + hash;
    if (search && search[0] !== '?') search = '?' + search;
    pathname = pathname.replace(/[?#]/g, encodeURIComponent);
    search = search.replace('#', '%23');
    return `${protocol}${host}${pathname}${search}${hash}`;
}
const urlObjectKeys = [
    'auth',
    'hash',
    'host',
    'hostname',
    'href',
    'path',
    'pathname',
    'port',
    'protocol',
    'query',
    'search',
    'slashes'
];
function formatWithValidation(url) {
    if ("TURBOPACK compile-time truthy", 1) {
        if (url !== null && typeof url === 'object') {
            Object.keys(url).forEach((key)=>{
                if (!urlObjectKeys.includes(key)) {
                    console.warn(`Unknown key passed via urlObject into url.format: ${key}`);
                }
            });
        }
    }
    return formatUrl(url);
}
}),
"[project]/node_modules/next/dist/client/use-merged-ref.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useMergedRef", {
    enumerable: true,
    get: function() {
        return useMergedRef;
    }
});
const _react = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
function useMergedRef(refA, refB) {
    const cleanupA = (0, _react.useRef)(null);
    const cleanupB = (0, _react.useRef)(null);
    // NOTE: In theory, we could skip the wrapping if only one of the refs is non-null.
    // (this happens often if the user doesn't pass a ref to Link/Form/Image)
    // But this can cause us to leak a cleanup-ref into user code (previously via `<Link legacyBehavior>`),
    // and the user might pass that ref into ref-merging library that doesn't support cleanup refs
    // (because it hasn't been updated for React 19)
    // which can then cause things to blow up, because a cleanup-returning ref gets called with `null`.
    // So in practice, it's safer to be defensive and always wrap the ref, even on React 19.
    return (0, _react.useCallback)((current)=>{
        if (current === null) {
            const cleanupFnA = cleanupA.current;
            if (cleanupFnA) {
                cleanupA.current = null;
                cleanupFnA();
            }
            const cleanupFnB = cleanupB.current;
            if (cleanupFnB) {
                cleanupB.current = null;
                cleanupFnB();
            }
        } else {
            if (refA) {
                cleanupA.current = applyRef(refA, current);
            }
            if (refB) {
                cleanupB.current = applyRef(refB, current);
            }
        }
    }, [
        refA,
        refB
    ]);
}
function applyRef(refA, current) {
    if (typeof refA === 'function') {
        const cleanup = refA(current);
        if (typeof cleanup === 'function') {
            return cleanup;
        } else {
            return ()=>refA(null);
        }
    } else {
        refA.current = current;
        return ()=>{
            refA.current = null;
        };
    }
}
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
}
}),
"[project]/node_modules/next/dist/shared/lib/utils.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    DecodeError: null,
    MiddlewareNotFoundError: null,
    MissingStaticPage: null,
    NormalizeError: null,
    PageNotFoundError: null,
    SP: null,
    ST: null,
    WEB_VITALS: null,
    execOnce: null,
    getDisplayName: null,
    getLocationOrigin: null,
    getURL: null,
    isAbsoluteUrl: null,
    isResSent: null,
    loadGetInitialProps: null,
    normalizeRepeatedSlashes: null,
    stringifyError: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    DecodeError: function() {
        return DecodeError;
    },
    MiddlewareNotFoundError: function() {
        return MiddlewareNotFoundError;
    },
    MissingStaticPage: function() {
        return MissingStaticPage;
    },
    NormalizeError: function() {
        return NormalizeError;
    },
    PageNotFoundError: function() {
        return PageNotFoundError;
    },
    SP: function() {
        return SP;
    },
    ST: function() {
        return ST;
    },
    WEB_VITALS: function() {
        return WEB_VITALS;
    },
    execOnce: function() {
        return execOnce;
    },
    getDisplayName: function() {
        return getDisplayName;
    },
    getLocationOrigin: function() {
        return getLocationOrigin;
    },
    getURL: function() {
        return getURL;
    },
    isAbsoluteUrl: function() {
        return isAbsoluteUrl;
    },
    isResSent: function() {
        return isResSent;
    },
    loadGetInitialProps: function() {
        return loadGetInitialProps;
    },
    normalizeRepeatedSlashes: function() {
        return normalizeRepeatedSlashes;
    },
    stringifyError: function() {
        return stringifyError;
    }
});
const WEB_VITALS = [
    'CLS',
    'FCP',
    'FID',
    'INP',
    'LCP',
    'TTFB'
];
function execOnce(fn) {
    let used = false;
    let result;
    return (...args)=>{
        if (!used) {
            used = true;
            result = fn(...args);
        }
        return result;
    };
}
// Scheme: https://tools.ietf.org/html/rfc3986#section-3.1
// Absolute URL: https://tools.ietf.org/html/rfc3986#section-4.3
const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/;
const isAbsoluteUrl = (url)=>ABSOLUTE_URL_REGEX.test(url);
function getLocationOrigin() {
    const { protocol, hostname, port } = window.location;
    return `${protocol}//${hostname}${port ? ':' + port : ''}`;
}
function getURL() {
    const { href } = window.location;
    const origin = getLocationOrigin();
    return href.substring(origin.length);
}
function getDisplayName(Component) {
    return typeof Component === 'string' ? Component : Component.displayName || Component.name || 'Unknown';
}
function isResSent(res) {
    return res.finished || res.headersSent;
}
function normalizeRepeatedSlashes(url) {
    const urlParts = url.split('?');
    const urlNoQuery = urlParts[0];
    return urlNoQuery // first we replace any non-encoded backslashes with forward
    // then normalize repeated forward slashes
    .replace(/\\/g, '/').replace(/\/\/+/g, '/') + (urlParts[1] ? `?${urlParts.slice(1).join('?')}` : '');
}
async function loadGetInitialProps(App, ctx) {
    if ("TURBOPACK compile-time truthy", 1) {
        if (App.prototype?.getInitialProps) {
            const message = `"${getDisplayName(App)}.getInitialProps()" is defined as an instance method - visit https://nextjs.org/docs/messages/get-initial-props-as-an-instance-method for more information.`;
            throw Object.defineProperty(new Error(message), "__NEXT_ERROR_CODE", {
                value: "E1035",
                enumerable: false,
                configurable: true
            });
        }
    }
    // when called from _app `ctx` is nested in `ctx`
    const res = ctx.res || ctx.ctx && ctx.ctx.res;
    if (!App.getInitialProps) {
        if (ctx.ctx && ctx.Component) {
            // @ts-ignore pageProps default
            return {
                pageProps: await loadGetInitialProps(ctx.Component, ctx.ctx)
            };
        }
        return {};
    }
    const props = await App.getInitialProps(ctx);
    if (res && isResSent(res)) {
        return props;
    }
    if (!props) {
        const message = `"${getDisplayName(App)}.getInitialProps()" should resolve to an object. But found "${props}" instead.`;
        throw Object.defineProperty(new Error(message), "__NEXT_ERROR_CODE", {
            value: "E1025",
            enumerable: false,
            configurable: true
        });
    }
    if ("TURBOPACK compile-time truthy", 1) {
        if (Object.keys(props).length === 0 && !ctx.ctx) {
            console.warn(`${getDisplayName(App)} returned an empty object from \`getInitialProps\`. This de-optimizes and prevents automatic static optimization. https://nextjs.org/docs/messages/empty-object-getInitialProps`);
        }
    }
    return props;
}
const SP = typeof performance !== 'undefined';
const ST = SP && [
    'mark',
    'measure',
    'getEntriesByName'
].every((method)=>typeof performance[method] === 'function');
class DecodeError extends Error {
}
class NormalizeError extends Error {
}
class PageNotFoundError extends Error {
    constructor(page){
        super();
        this.code = 'ENOENT';
        this.name = 'PageNotFoundError';
        this.message = `Cannot find module for page: ${page}`;
    }
}
class MissingStaticPage extends Error {
    constructor(page, message){
        super();
        this.message = `Failed to load static file for page: ${page} ${message}`;
    }
}
class MiddlewareNotFoundError extends Error {
    constructor(){
        super();
        this.code = 'ENOENT';
        this.message = `Cannot find the middleware module`;
    }
}
function stringifyError(error) {
    return JSON.stringify({
        message: error.message,
        stack: error.stack
    });
}
}),
"[project]/node_modules/next/dist/shared/lib/router/utils/is-local-url.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "isLocalURL", {
    enumerable: true,
    get: function() {
        return isLocalURL;
    }
});
const _utils = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/utils.js [app-client] (ecmascript)");
const _hasbasepath = __turbopack_context__.r("[project]/node_modules/next/dist/client/has-base-path.js [app-client] (ecmascript)");
function isLocalURL(url) {
    // prevent a hydration mismatch on href for url with anchor refs
    if (!(0, _utils.isAbsoluteUrl)(url)) return true;
    try {
        // absolute urls can be local if they are on the same origin
        const locationOrigin = (0, _utils.getLocationOrigin)();
        const resolved = new URL(url, locationOrigin);
        return resolved.origin === locationOrigin && (0, _hasbasepath.hasBasePath)(resolved.pathname);
    } catch (_) {
        return false;
    }
}
}),
"[project]/node_modules/next/dist/shared/lib/utils/error-once.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "errorOnce", {
    enumerable: true,
    get: function() {
        return errorOnce;
    }
});
let errorOnce = (_)=>{};
if ("TURBOPACK compile-time truthy", 1) {
    const errors = new Set();
    errorOnce = (msg)=>{
        if (!errors.has(msg)) {
            console.error(msg);
        }
        errors.add(msg);
    };
}
}),
"[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    default: null,
    useLinkStatus: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    /**
 * A React component that extends the HTML `<a>` element to provide
 * [prefetching](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#2-prefetching)
 * and client-side navigation. This is the primary way to navigate between routes in Next.js.
 *
 * @remarks
 * - Prefetching is only enabled in production.
 *
 * @see https://nextjs.org/docs/app/api-reference/components/link
 */ default: function() {
        return LinkComponent;
    },
    useLinkStatus: function() {
        return useLinkStatus;
    }
});
const _interop_require_wildcard = __turbopack_context__.r("[project]/node_modules/@swc/helpers/cjs/_interop_require_wildcard.cjs [app-client] (ecmascript)");
const _jsxruntime = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
const _react = /*#__PURE__*/ _interop_require_wildcard._(__turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"));
const _formaturl = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/router/utils/format-url.js [app-client] (ecmascript)");
const _approutercontextsharedruntime = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js [app-client] (ecmascript)");
const _usemergedref = __turbopack_context__.r("[project]/node_modules/next/dist/client/use-merged-ref.js [app-client] (ecmascript)");
const _utils = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/utils.js [app-client] (ecmascript)");
const _addbasepath = __turbopack_context__.r("[project]/node_modules/next/dist/client/add-base-path.js [app-client] (ecmascript)");
const _warnonce = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/utils/warn-once.js [app-client] (ecmascript)");
const _routerreducertypes = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/router-reducer/router-reducer-types.js [app-client] (ecmascript)");
const _links = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/links.js [app-client] (ecmascript)");
const _islocalurl = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/router/utils/is-local-url.js [app-client] (ecmascript)");
const _types = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/segment-cache/types.js [app-client] (ecmascript)");
const _erroronce = __turbopack_context__.r("[project]/node_modules/next/dist/shared/lib/utils/error-once.js [app-client] (ecmascript)");
function isModifiedEvent(event) {
    const eventTarget = event.currentTarget;
    const target = eventTarget.getAttribute('target');
    return target && target !== '_self' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || // triggers resource download
    event.nativeEvent && event.nativeEvent.which === 2;
}
function linkClicked(e, href, linkInstanceRef, replace, scroll, onNavigate, transitionTypes) {
    if (typeof window !== 'undefined') {
        const { nodeName } = e.currentTarget;
        // anchors inside an svg have a lowercase nodeName
        const isAnchorNodeName = nodeName.toUpperCase() === 'A';
        if (isAnchorNodeName && isModifiedEvent(e) || e.currentTarget.hasAttribute('download')) {
            // ignore click for browser’s default behavior
            return;
        }
        if (!(0, _islocalurl.isLocalURL)(href)) {
            if (replace) {
                // browser default behavior does not replace the history state
                // so we need to do it manually
                e.preventDefault();
                location.replace(href);
            }
            // ignore click for browser’s default behavior
            return;
        }
        e.preventDefault();
        if (onNavigate) {
            let isDefaultPrevented = false;
            onNavigate({
                preventDefault: ()=>{
                    isDefaultPrevented = true;
                }
            });
            if (isDefaultPrevented) {
                return;
            }
        }
        const { dispatchNavigateAction } = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/app-router-instance.js [app-client] (ecmascript)");
        _react.default.startTransition(()=>{
            dispatchNavigateAction(href, replace ? 'replace' : 'push', scroll === false ? _routerreducertypes.ScrollBehavior.NoScroll : _routerreducertypes.ScrollBehavior.Default, linkInstanceRef.current, transitionTypes);
        });
    }
}
function formatStringOrUrl(urlObjOrString) {
    if (typeof urlObjOrString === 'string') {
        return urlObjOrString;
    }
    return (0, _formaturl.formatUrl)(urlObjOrString);
}
function LinkComponent(props) {
    const [linkStatus, setOptimisticLinkStatus] = (0, _react.useOptimistic)(_links.IDLE_LINK_STATUS);
    let children;
    const linkInstanceRef = (0, _react.useRef)(null);
    const { href: hrefProp, as: asProp, children: childrenProp, prefetch: prefetchProp = null, passHref, replace, shallow, scroll, onClick, onMouseEnter: onMouseEnterProp, onTouchStart: onTouchStartProp, legacyBehavior = false, onNavigate, transitionTypes, ref: forwardedRef, unstable_dynamicOnHover, ...restProps } = props;
    children = childrenProp;
    if (legacyBehavior && (typeof children === 'string' || typeof children === 'number')) {
        children = /*#__PURE__*/ (0, _jsxruntime.jsx)("a", {
            children: children
        });
    }
    const router = _react.default.useContext(_approutercontextsharedruntime.AppRouterContext);
    const prefetchEnabled = prefetchProp !== false;
    const fetchStrategy = prefetchProp !== false ? getFetchStrategyFromPrefetchProp(prefetchProp) : _types.FetchStrategy.PPR;
    if ("TURBOPACK compile-time truthy", 1) {
        function createPropError(args) {
            return Object.defineProperty(new Error(`Failed prop type: The prop \`${args.key}\` expects a ${args.expected} in \`<Link>\`, but got \`${args.actual}\` instead.` + (typeof window !== 'undefined' ? "\nOpen your browser's console to view the Component stack trace." : '')), "__NEXT_ERROR_CODE", {
                value: "E319",
                enumerable: false,
                configurable: true
            });
        }
        // TypeScript trick for type-guarding:
        const requiredPropsGuard = {
            href: true
        };
        const requiredProps = Object.keys(requiredPropsGuard);
        requiredProps.forEach((key)=>{
            if (key === 'href') {
                if (props[key] == null || typeof props[key] !== 'string' && typeof props[key] !== 'object') {
                    throw createPropError({
                        key,
                        expected: '`string` or `object`',
                        actual: props[key] === null ? 'null' : typeof props[key]
                    });
                }
            } else {
                // TypeScript trick for type-guarding:
                const _ = key;
            }
        });
        // TypeScript trick for type-guarding:
        const optionalPropsGuard = {
            as: true,
            replace: true,
            scroll: true,
            shallow: true,
            passHref: true,
            prefetch: true,
            unstable_dynamicOnHover: true,
            onClick: true,
            onMouseEnter: true,
            onTouchStart: true,
            legacyBehavior: true,
            onNavigate: true,
            transitionTypes: true
        };
        const optionalProps = Object.keys(optionalPropsGuard);
        optionalProps.forEach((key)=>{
            const valType = typeof props[key];
            if (key === 'as') {
                if (props[key] && valType !== 'string' && valType !== 'object') {
                    throw createPropError({
                        key,
                        expected: '`string` or `object`',
                        actual: valType
                    });
                }
            } else if (key === 'onClick' || key === 'onMouseEnter' || key === 'onTouchStart' || key === 'onNavigate') {
                if (props[key] && valType !== 'function') {
                    throw createPropError({
                        key,
                        expected: '`function`',
                        actual: valType
                    });
                }
            } else if (key === 'replace' || key === 'scroll' || key === 'shallow' || key === 'passHref' || key === 'legacyBehavior' || key === 'unstable_dynamicOnHover') {
                if (props[key] != null && valType !== 'boolean') {
                    throw createPropError({
                        key,
                        expected: '`boolean`',
                        actual: valType
                    });
                }
            } else if (key === 'prefetch') {
                if (props[key] != null && valType !== 'boolean' && props[key] !== 'auto') {
                    throw createPropError({
                        key,
                        expected: '`boolean | "auto"`',
                        actual: valType
                    });
                }
            } else if (key === 'transitionTypes') {
                if (props[key] != null && !Array.isArray(props[key])) {
                    throw createPropError({
                        key,
                        expected: '`string[]`',
                        actual: valType
                    });
                }
            } else {
                // TypeScript trick for type-guarding:
                const _ = key;
            }
        });
    }
    const resolvedHref = asProp || hrefProp;
    const formattedHref = formatStringOrUrl(resolvedHref);
    if ("TURBOPACK compile-time truthy", 1) {
        if (props.locale) {
            (0, _warnonce.warnOnce)('The `locale` prop is not supported in `next/link` while using the `app` router. Read more about app router internalization: https://nextjs.org/docs/app/building-your-application/routing/internationalization');
        }
        if (!asProp) {
            let href;
            if (typeof resolvedHref === 'string') {
                href = resolvedHref;
            } else if (typeof resolvedHref === 'object' && typeof resolvedHref.pathname === 'string') {
                href = resolvedHref.pathname;
            }
            if (href) {
                const hasDynamicSegment = href.split('/').some((segment)=>segment.startsWith('[') && segment.endsWith(']'));
                if (hasDynamicSegment) {
                    throw Object.defineProperty(new Error(`Dynamic href \`${href}\` found in <Link> while using the \`/app\` router, this is not supported. Read more: https://nextjs.org/docs/messages/app-dir-dynamic-href`), "__NEXT_ERROR_CODE", {
                        value: "E267",
                        enumerable: false,
                        configurable: true
                    });
                }
            }
        }
    }
    // This will return the first child, if multiple are provided it will throw an error
    let child;
    if (legacyBehavior) {
        if (children?.$$typeof === Symbol.for('react.lazy')) {
            throw Object.defineProperty(new Error(`\`<Link legacyBehavior>\` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's \`<a>\` tag.`), "__NEXT_ERROR_CODE", {
                value: "E863",
                enumerable: false,
                configurable: true
            });
        }
        if ("TURBOPACK compile-time truthy", 1) {
            if (onClick) {
                console.warn(`"onClick" was passed to <Link> with \`href\` of \`${formattedHref}\` but "legacyBehavior" was set. The legacy behavior requires onClick be set on the child of next/link`);
            }
            if (onMouseEnterProp) {
                console.warn(`"onMouseEnter" was passed to <Link> with \`href\` of \`${formattedHref}\` but "legacyBehavior" was set. The legacy behavior requires onMouseEnter be set on the child of next/link`);
            }
            try {
                child = _react.default.Children.only(children);
            } catch (err) {
                if (!children) {
                    throw Object.defineProperty(new Error(`No children were passed to <Link> with \`href\` of \`${formattedHref}\` but one child is required https://nextjs.org/docs/messages/link-no-children`), "__NEXT_ERROR_CODE", {
                        value: "E320",
                        enumerable: false,
                        configurable: true
                    });
                }
                throw Object.defineProperty(new Error(`Multiple children were passed to <Link> with \`href\` of \`${formattedHref}\` but only one child is supported https://nextjs.org/docs/messages/link-multiple-children` + (typeof window !== 'undefined' ? " \nOpen your browser's console to view the Component stack trace." : '')), "__NEXT_ERROR_CODE", {
                    value: "E266",
                    enumerable: false,
                    configurable: true
                });
            }
        } else //TURBOPACK unreachable
        ;
    } else {
        if ("TURBOPACK compile-time truthy", 1) {
            if (children?.type === 'a') {
                throw Object.defineProperty(new Error('Invalid <Link> with <a> child. Please remove <a> or use <Link legacyBehavior>.\nLearn more: https://nextjs.org/docs/messages/invalid-new-link-with-extra-anchor'), "__NEXT_ERROR_CODE", {
                    value: "E209",
                    enumerable: false,
                    configurable: true
                });
            }
        }
    }
    const childRef = legacyBehavior ? child && typeof child === 'object' && child.ref : forwardedRef;
    // Use a callback ref to attach an IntersectionObserver to the anchor tag on
    // mount. In the future we will also use this to keep track of all the
    // currently mounted <Link> instances, e.g. so we can re-prefetch them after
    // a revalidation or refresh.
    const observeLinkVisibilityOnMount = _react.default.useCallback({
        "LinkComponent.useCallback[observeLinkVisibilityOnMount]": (element)=>{
            if (router !== null) {
                linkInstanceRef.current = (0, _links.mountLinkInstance)(element, formattedHref, router, fetchStrategy, prefetchEnabled, setOptimisticLinkStatus);
            }
            return ({
                "LinkComponent.useCallback[observeLinkVisibilityOnMount]": ()=>{
                    if (linkInstanceRef.current) {
                        (0, _links.unmountLinkForCurrentNavigation)(linkInstanceRef.current);
                        linkInstanceRef.current = null;
                    }
                    (0, _links.unmountPrefetchableInstance)(element);
                }
            })["LinkComponent.useCallback[observeLinkVisibilityOnMount]"];
        }
    }["LinkComponent.useCallback[observeLinkVisibilityOnMount]"], [
        prefetchEnabled,
        formattedHref,
        router,
        fetchStrategy,
        setOptimisticLinkStatus
    ]);
    const mergedRef = (0, _usemergedref.useMergedRef)(observeLinkVisibilityOnMount, childRef);
    const childProps = {
        ref: mergedRef,
        onClick (e) {
            if ("TURBOPACK compile-time truthy", 1) {
                if (!e) {
                    throw Object.defineProperty(new Error(`Component rendered inside next/link has to pass click event to "onClick" prop.`), "__NEXT_ERROR_CODE", {
                        value: "E312",
                        enumerable: false,
                        configurable: true
                    });
                }
            }
            if (!legacyBehavior && typeof onClick === 'function') {
                onClick(e);
            }
            if (legacyBehavior && child.props && typeof child.props.onClick === 'function') {
                child.props.onClick(e);
            }
            if (!router) {
                return;
            }
            if (e.defaultPrevented) {
                return;
            }
            linkClicked(e, formattedHref, linkInstanceRef, replace, scroll, onNavigate, transitionTypes);
        },
        onMouseEnter (e) {
            if (!legacyBehavior && typeof onMouseEnterProp === 'function') {
                onMouseEnterProp(e);
            }
            if (legacyBehavior && child.props && typeof child.props.onMouseEnter === 'function') {
                child.props.onMouseEnter(e);
            }
            if (!router) {
                return;
            }
            if ("TURBOPACK compile-time truthy", 1) {
                return;
            }
            //TURBOPACK unreachable
            ;
            const upgradeToDynamicPrefetch = undefined;
        },
        onTouchStart: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : function onTouchStart(e) {
            if (!legacyBehavior && typeof onTouchStartProp === 'function') {
                onTouchStartProp(e);
            }
            if (legacyBehavior && child.props && typeof child.props.onTouchStart === 'function') {
                child.props.onTouchStart(e);
            }
            if (!router) {
                return;
            }
            if (!prefetchEnabled) {
                return;
            }
            const upgradeToDynamicPrefetch = unstable_dynamicOnHover === true;
            (0, _links.onNavigationIntent)(e.currentTarget, upgradeToDynamicPrefetch);
        }
    };
    // If the url is absolute, we can bypass the logic to prepend the basePath.
    if ((0, _utils.isAbsoluteUrl)(formattedHref)) {
        childProps.href = formattedHref;
    } else if (!legacyBehavior || passHref || child.type === 'a' && !('href' in child.props)) {
        childProps.href = (0, _addbasepath.addBasePath)(formattedHref);
    }
    let link;
    if (legacyBehavior) {
        if ("TURBOPACK compile-time truthy", 1) {
            (0, _erroronce.errorOnce)('`legacyBehavior` is deprecated and will be removed in a future ' + 'release. A codemod is available to upgrade your components:\n\n' + 'npx @next/codemod@latest new-link .\n\n' + 'Learn more: https://nextjs.org/docs/app/building-your-application/upgrading/codemods#remove-a-tags-from-link-components');
        }
        link = /*#__PURE__*/ _react.default.cloneElement(child, childProps);
    } else {
        link = /*#__PURE__*/ (0, _jsxruntime.jsx)("a", {
            ...restProps,
            ...childProps,
            children: children
        });
    }
    return /*#__PURE__*/ (0, _jsxruntime.jsx)(LinkStatusContext.Provider, {
        value: linkStatus,
        children: link
    });
}
const LinkStatusContext = /*#__PURE__*/ (0, _react.createContext)(_links.IDLE_LINK_STATUS);
const useLinkStatus = ()=>{
    return (0, _react.useContext)(LinkStatusContext);
};
function getFetchStrategyFromPrefetchProp(prefetchProp) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        return prefetchProp === null || prefetchProp === 'auto' ? _types.FetchStrategy.PPR : // (although invalid values should've been filtered out by prop validation in dev)
        _types.FetchStrategy.Full;
    }
}
if ((typeof exports.default === 'function' || typeof exports.default === 'object' && exports.default !== null) && typeof exports.default.__esModule === 'undefined') {
    Object.defineProperty(exports.default, '__esModule', {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
}
}),
"[project]/node_modules/next/navigation.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}),
"[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__iconNode",
    ()=>__iconNode,
    "default",
    ()=>ArrowRight
]);
/**
 * @license lucide-react v0.562.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M5 12h14",
            key: "1ays0h"
        }
    ],
    [
        "path",
        {
            d: "m12 5 7 7-7 7",
            key: "xquz4c"
        }
    ]
];
const ArrowRight = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("arrow-right", __iconNode);
;
}),
"[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.js [app-client] (ecmascript) <export default as ArrowRight>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ArrowRight",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.js [app-client] (ecmascript)");
}),
]);

//# sourceMappingURL=_0lptr43._.js.map