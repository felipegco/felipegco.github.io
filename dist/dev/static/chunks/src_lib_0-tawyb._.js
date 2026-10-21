(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/scene-engine.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "box",
    ()=>box,
    "clamp01",
    ()=>clamp01,
    "createStage",
    ()=>createStage,
    "cylinder",
    ()=>cylinder,
    "readTokens",
    ()=>readTokens,
    "smooth",
    ()=>smooth,
    "span",
    ()=>span
]);
// Motor das cenas 3D do portfólio. Cada cena (introdução, requisição do e-Move)
// monta seus objetos com build() e devolve as posições da câmera e um update(s).
// O motor cuida do resto: renderizador, luz, chão, cores do tema, tamanho,
// ponteiro e redesenho só quando algo muda.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.module.js [app-client] (ecmascript) <locals>");
;
const clamp01 = (v)=>Math.min(Math.max(v, 0), 1);
const span = (v, a, b)=>clamp01((v - a) / (b - a));
const smooth = (t)=>t * t * (3 - 2 * t);
function box(w, h, d, material) {
    const mesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](w, h, d), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}
function cylinder(r, h, material) {
    const mesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CylinderGeometry"](r, r, h, 48), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}
function readTokens() {
    const css = getComputedStyle(document.documentElement);
    const get = (name, fallback)=>css.getPropertyValue(name).trim() || fallback;
    return {
        ground: get('--ground', '#0a0a0a'),
        paper: get('--paper', '#141416'),
        floor: get('--scene-floor', '#101012'),
        body: get('--scene-body', '#2a2a30'),
        dim: get('--scene-dim', '#3c3c44'),
        accent: get('--accent', '#3b82f6'),
        ink: get('--ink', '#ededed'),
        muted: get('--muted', '#a1a1aa')
    };
}
// keys: [{ s, pos, look, hold }] em ordem de s. Entre duas paradas (hold) a câmera
// só anda dentro de window (fração do trecho); nos trechos livres ela anda o tempo todo.
function cameraAt(keys, s, pos, look, [from, to] = [
    0.1,
    0.9
]) {
    let i = 0;
    while(i < keys.length - 2 && s > keys[i + 1].s)i++;
    const a = keys[i];
    const b = keys[i + 1];
    const u = span(s, a.s, b.s);
    const e = a.hold && b.hold ? smooth(span(u, from, to)) : smooth(u);
    pos.lerpVectors(a.pos, b.pos, e);
    look.lerpVectors(a.look, b.look, e);
}
function createStage(canvas, { build, onReady }) {
    let renderer;
    try {
        renderer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WebGLRenderer"]({
            canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
    } catch  {
        return null;
    }
    // Até 1024px o canvas ocupa a metade de cima e o texto fica embaixo
    const stacked = window.matchMedia('(max-width: 1024px)');
    renderer.outputColorSpace = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SRGBColorSpace"];
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PCFSoftShadowMap"];
    const scene = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Scene"]();
    const camera = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PerspectiveCamera"](36, 1, 0.1, 200);
    const tokens = readTokens();
    const mats = {
        floor: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
            roughness: 1
        }),
        body: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
            roughness: 0.55,
            metalness: 0.08
        }),
        dim: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
            roughness: 0.7
        }),
        accent: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
            roughness: 0.4
        }),
        ink: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
            roughness: 0.4
        }),
        route: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshBasicMaterial"](),
        routeLit: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshBasicMaterial"](),
        returnLit: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshBasicMaterial"](),
        led: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]()
    };
    const hemi = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HemisphereLight"](0xffffff, 0x444444, 1.9);
    const sun = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DirectionalLight"](0xffffff, 2.4);
    sun.castShadow = true;
    const mapSize = stacked.matches ? 1024 : 2048;
    sun.shadow.mapSize.set(mapSize, mapSize);
    sun.shadow.radius = 4;
    scene.add(hemi, sun, sun.target);
    const floor = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlaneGeometry"](400, 400), mats.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const world = build({
        scene,
        mats,
        tokens,
        stacked
    });
    // A sombra cobre a área da cena: centro e meia largura vêm do mundo
    const { center, size } = world.shadow;
    sun.position.set(center.x - 10, 20, center.z + 14);
    sun.target.position.copy(center);
    Object.assign(sun.shadow.camera, {
        left: -size,
        right: size,
        top: size * 0.85,
        bottom: -size * 0.85,
        near: 1,
        far: 70
    });
    sun.shadow.camera.updateProjectionMatrix();
    const applyTokens = ()=>{
        Object.assign(tokens, readTokens());
        scene.background = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](tokens.ground);
        scene.fog = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fog"](tokens.ground, 46, 110);
        mats.floor.color.set(tokens.floor);
        mats.body.color.set(tokens.body);
        mats.dim.color.set(tokens.dim);
        mats.accent.color.set(tokens.accent);
        mats.ink.color.set(tokens.ink);
        mats.route.color.set(tokens.dim);
        mats.routeLit.color.set(tokens.accent);
        mats.returnLit.color.set(tokens.ink);
        mats.led.color.set(tokens.muted);
        hemi.groundColor.set(tokens.floor);
        world.onTokens?.(tokens);
    };
    applyTokens();
    const pos = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]();
    const look = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]();
    function place(s, px, py) {
        cameraAt(world.keys, s, pos, look, world.holdWindow);
        if (stacked.matches) pos.sub(look).multiplyScalar(world.stackedZoom ?? 1.2).add(look);
        pos.x += px * 0.7;
        pos.y += py * 0.4;
        camera.position.copy(pos);
        camera.lookAt(look);
    }
    // No computador o objeto fica à direita, longe do texto
    let dirty = true;
    function resize() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (!w || !h) return;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, stacked.matches ? 1.5 : 1.75));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.fov = stacked.matches ? 42 : 36;
        if (stacked.matches) camera.clearViewOffset();
        else camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
        camera.updateProjectionMatrix();
        dirty = true;
    }
    let target = 0;
    let progress = 0;
    const pointer = {
        x: 0,
        y: 0,
        tx: 0,
        ty: 0
    };
    let visible = true;
    let raf = 0;
    let first = true;
    let moving = false;
    function tick(time) {
        raf = requestAnimationFrame(tick);
        if (!visible) return;
        const dp = target - progress;
        if (Math.abs(dp) > 0.00005) {
            progress += dp * 0.07;
            dirty = true;
        } else if (progress !== target) {
            progress = target;
            dirty = true;
        }
        const dx = pointer.tx - pointer.x;
        const dy = pointer.ty - pointer.y;
        if (Math.abs(dx) + Math.abs(dy) > 0.0005) {
            pointer.x += dx * 0.06;
            pointer.y += dy * 0.06;
            dirty = true;
        }
        if (!dirty && !moving) return;
        dirty = false;
        const s = progress * world.beats;
        // update devolve true enquanto algo se move sozinho (peças flutuando na abertura)
        moving = !!world.update(s, time / 1000);
        place(s, pointer.x, pointer.y);
        renderer.render(scene, camera);
        if (first) {
            first = false;
            onReady?.();
        }
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const themeObserver = new MutationObserver(()=>{
        applyTokens();
        dirty = true;
    });
    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: [
            'data-theme'
        ]
    });
    const viewObserver = new IntersectionObserver(([entry])=>{
        visible = entry.isIntersecting;
    });
    viewObserver.observe(canvas);
    resize();
    raf = requestAnimationFrame(tick);
    return {
        setProgress (p) {
            target = clamp01(p);
        },
        setPointer (x, y) {
            pointer.tx = x;
            pointer.ty = y;
        },
        dispose () {
            cancelAnimationFrame(raf);
            resizeObserver.disconnect();
            themeObserver.disconnect();
            viewObserver.disconnect();
            world.dispose?.();
            scene.traverse((obj)=>obj.geometry?.dispose());
            Object.values(mats).forEach((m)=>m.dispose());
            renderer.dispose();
        }
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/intro-world.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createWorld",
    ()=>createWorld
]);
// Cena 3D da introdução, "do hardware à API":
// 0 peças soltas · 1 o gabinete montado (Marino) · 2 o gabinete deitado num rack (Brascabos)
// · 3 o rack aceso e uma requisição saindo para a cena do e-Move.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/scene-engine.js [app-client] (ecmascript)");
;
;
// O gabinete tem o centro na origem; o lado aberto olha para +z
const TOWER_Y = 2.2;
const SLOT_Y = 2.15;
// O gabinete já está de pé; só as peças de dentro começam soltas, na frente dele.
// [nome, [largura, altura, profundidade], posição final, deslocamento solto, rotação solta, material]
const PARTS = [
    [
        'back',
        [
            4.2,
            4.4,
            0.08
        ],
        [
            0,
            0,
            -0.96
        ],
        [
            0,
            0,
            0
        ],
        [
            0,
            0,
            0
        ],
        'body'
    ],
    [
        'top',
        [
            4.2,
            0.08,
            2
        ],
        [
            0,
            2.16,
            0
        ],
        [
            0,
            0,
            0
        ],
        [
            0,
            0,
            0
        ],
        'body'
    ],
    [
        'bottom',
        [
            4.2,
            0.08,
            2
        ],
        [
            0,
            -2.16,
            0
        ],
        [
            0,
            0,
            0
        ],
        [
            0,
            0,
            0
        ],
        'body'
    ],
    [
        'front',
        [
            0.08,
            4.4,
            2
        ],
        [
            2.06,
            0,
            0
        ],
        [
            0,
            0,
            0
        ],
        [
            0,
            0,
            0
        ],
        'body'
    ],
    [
        'rear',
        [
            0.08,
            4.4,
            2
        ],
        [
            -2.06,
            0,
            0
        ],
        [
            0,
            0,
            0
        ],
        [
            0,
            0,
            0
        ],
        'body'
    ],
    [
        'board',
        [
            3.0,
            3.2,
            0.06
        ],
        [
            -0.3,
            0.3,
            -0.88
        ],
        [
            0.2,
            1.9,
            0.8
        ],
        [
            0.35,
            0.25,
            0.05
        ],
        'dim'
    ],
    [
        'cooler',
        [
            0.9,
            0.9,
            0.6
        ],
        [
            -0.4,
            0.9,
            -0.55
        ],
        [
            1.2,
            1.0,
            2.8
        ],
        [
            0.8,
            0.4,
            0.3
        ],
        'body'
    ],
    [
        'ram-1',
        [
            0.08,
            1.2,
            0.22
        ],
        [
            0.45,
            0.9,
            -0.74
        ],
        [
            1.7,
            0.6,
            2.9
        ],
        [
            0.2,
            0.9,
            0.6
        ],
        'accent'
    ],
    [
        'ram-2',
        [
            0.08,
            1.2,
            0.22
        ],
        [
            0.67,
            0.9,
            -0.74
        ],
        [
            2.1,
            0.1,
            2.6
        ],
        [
            0.5,
            0.7,
            0.2
        ],
        'accent'
    ],
    [
        'gpu',
        [
            2.4,
            0.3,
            0.9
        ],
        [
            -0.5,
            -0.4,
            -0.4
        ],
        [
            -1.4,
            -0.9,
            3.0
        ],
        [
            0.5,
            -0.5,
            0.3
        ],
        'body'
    ],
    [
        'psu',
        [
            1.5,
            1.0,
            1.7
        ],
        [
            -1.2,
            -1.6,
            0
        ],
        [
            -2.4,
            -0.4,
            1.9
        ],
        [
            0.2,
            0.5,
            0
        ],
        'body'
    ],
    [
        'ssd',
        [
            0.8,
            0.06,
            0.5
        ],
        [
            1.3,
            -1.2,
            -0.5
        ],
        [
            1.9,
            -1.2,
            2.8
        ],
        [
            0.6,
            0.3,
            0.4
        ],
        'accent'
    ]
];
// Ventoinhas: deixam a placa de vídeo, o cooler e a fonte reconhecíveis
const FANS = [
    [
        'gpu',
        0.32,
        [
            -0.6,
            0.17,
            0
        ],
        'y'
    ],
    [
        'gpu',
        0.32,
        [
            0.6,
            0.17,
            0
        ],
        'y'
    ],
    [
        'cooler',
        0.38,
        [
            0,
            0,
            0.31
        ],
        'z'
    ],
    [
        'psu',
        0.36,
        [
            0,
            0.51,
            0.2
        ],
        'y'
    ]
];
const UNIT_YS = [
    0.35,
    0.85,
    1.35,
    2.95,
    3.45
];
function build({ scene, mats }) {
    const machine = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    machine.position.set(0, TOWER_Y, 0);
    const parts = PARTS.map(([name, [w, h, d], at, loose, turn, mat], i)=>{
        const mesh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["box"])(w, h, d, mats[mat]);
        machine.add(mesh);
        return {
            mesh,
            at: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](...at),
            loose: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](...at).add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](...loose)),
            turn: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](...turn),
            delay: Math.max(0, i - 5) * 0.02,
            phase: i * 1.7
        };
    });
    FANS.forEach(([name, r, at, axis])=>{
        const part = parts[PARTS.findIndex(([n])=>n === name)].mesh;
        const fan = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cylinder"])(r, 0.05, mats.dim);
        if (axis === 'z') fan.rotation.x = Math.PI / 2;
        fan.position.set(...at);
        part.add(fan);
    });
    // A tampa fecha o lado aberto antes de o gabinete virar servidor
    const lid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["box"])(4.2, 4.4, 0.06, mats.body);
    machine.add(lid);
    const lidAt = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](0, 0, 1.0);
    const lidFrom = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](0, 0, 4.0);
    // O LED fica na frente; depois de deitado, a frente olha para a câmera
    const machineLed = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](0.05, 0.14, 0.4), mats.led);
    machineLed.position.set(2.12, 1.4, 0.4);
    machine.add(machineLed);
    // Deitar o gabinete: primeiro o lado aberto vira para cima, depois a frente vira para +z
    const upright = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Quaternion"]();
    const lying = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Quaternion"]().setFromEuler(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Euler"](0, -Math.PI / 2, 0)).multiply(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Quaternion"]().setFromEuler(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Euler"](-Math.PI / 2, 0, 0)));
    // Rack aberto na frente, com cinco servidores e uma vaga de 2U no meio
    const rack = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    const sideL = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["box"])(0.12, 3.9, 2.4, mats.body);
    sideL.position.set(-1.26, 1.95, 0);
    const sideR = sideL.clone();
    sideR.position.x = 1.26;
    const rackTop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["box"])(2.64, 0.12, 2.4, mats.body);
    rackTop.position.set(0, 3.96, 0);
    const rackBack = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["box"])(2.64, 3.9, 0.1, mats.body);
    rackBack.position.set(0, 1.95, -1.2);
    rack.add(sideL, sideR, rackTop, rackBack);
    const leds = UNIT_YS.map((y)=>{
        const unit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["box"])(2.2, 0.42, 2.1, mats.dim);
        unit.position.set(0, y, 0);
        const led = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](0.3, 0.1, 0.04), mats.led);
        led.position.set(0.75, y, 1.07);
        rack.add(unit, led);
        return led;
    });
    // O cabo por onde sai a primeira requisição, rumo à cena do e-Move
    const cable = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QuadraticBezierCurve3"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](1.1, SLOT_Y, 1.1), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](5, 0.35, 3), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](16, 0.35, 1));
    const TUBE = 100;
    const RADIAL = 8;
    const cableBase = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TubeGeometry"](cable, TUBE, 0.035, RADIAL, false), mats.route);
    const cableLit = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TubeGeometry"](cable, TUBE, 0.055, RADIAL, false), mats.routeLit);
    const packet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["box"])(0.52, 0.34, 0.34, mats.accent);
    scene.add(machine, rack, cableBase, cableLit, packet);
    const tmp = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]();
    const ahead = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]();
    function update(s, time) {
        // Os cards aparecem a ±0,12 de cada parada; tudo se move só no intervalo entre eles,
        // então cada card mostra a cena parada.
        // 0 → 1: depois que a abertura some, as peças se encaixam uma depois da outra
        // e estão todas no lugar antes de "Comecei pelo hardware" aparecer
        let floating = false;
        parts.forEach((p)=>{
            const f = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["smooth"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["span"])(s, 0.34 + p.delay, 0.54 + p.delay));
            const loose = 1 - f;
            if (loose > 0.001) floating = true;
            p.mesh.position.lerpVectors(p.loose, p.at, f);
            p.mesh.position.y += Math.sin(time * 0.9 + p.phase) * 0.14 * loose;
            p.mesh.rotation.set(p.turn.x * loose + Math.sin(time * 0.5 + p.phase) * 0.08 * loose, p.turn.y * loose, p.turn.z * loose);
        });
        // 1 → 2: com o card do hardware fora da tela, a tampa aparece e fecha,
        // o gabinete deita e o rack desliza em volta dele
        // O trecho ocupa quase o caminho todo: o deslize freia no fim, então a virada
        // e o rack precisam de espaço para não acontecer de uma vez
        const fLid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["smooth"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["span"])(s, 1.12, 1.4));
        lid.visible = s > 1.12;
        lid.position.lerpVectors(lidFrom, lidAt, fLid);
        const fTurn = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["smooth"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["span"])(s, 1.3, 1.7));
        machine.quaternion.slerpQuaternions(upright, lying, fTurn);
        machine.scale.setScalar(1 - fTurn * 0.5);
        machine.position.y = TOWER_Y + (SLOT_Y - TOWER_Y) * fTurn;
        const fRack = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["smooth"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["span"])(s, 1.5, 1.88));
        rack.visible = s > 1.48;
        rack.position.z = -9 * (1 - fRack);
        // 2 → 3: os servidores acendem e a requisição sai pelo cabo
        leds.forEach((led, i)=>{
            led.material = s > 2.36 + i * 0.03 ? mats.accent : mats.led;
        });
        machineLed.material = s > 2.34 ? mats.accent : mats.led;
        const fCable = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["smooth"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["span"])(s, 2.4, 2.6));
        cableBase.visible = s > 2.34;
        cableLit.geometry.setDrawRange(0, Math.floor(fCable * TUBE) * RADIAL * 6);
        const fPacket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["smooth"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["span"])(s, 2.44, 2.66));
        packet.visible = s > 2.44 && fPacket < 0.97;
        packet.position.copy(cable.getPoint(fPacket));
        ahead.copy(cable.getPoint(Math.min(fPacket + 0.01, 1))).sub(packet.position);
        if (ahead.lengthSq() > 1e-8) packet.lookAt(tmp.copy(packet.position).add(ahead));
        return floating;
    }
    const key = (s, pos, look)=>({
            s,
            pos: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](...pos),
            look: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](...look),
            hold: true
        });
    return {
        // 0–3 as paradas; 3 → 4 a saída, enquanto os projetos sobem por cima
        beats: 4,
        keys: [
            key(0, [
                -2.0,
                4.4,
                17.5
            ], [
                -0.3,
                1.9,
                0.6
            ]),
            key(1, [
                3.4,
                4.2,
                12
            ], [
                0,
                2.1,
                0
            ]),
            key(2, [
                -3.4,
                3.6,
                10.5
            ], [
                0,
                2.0,
                0
            ]),
            key(3, [
                2.2,
                3.8,
                12
            ], [
                3.0,
                1.7,
                0.5
            ]),
            // Saída: a câmera entra no servidor aceso
            key(4, [
                0.7,
                2.25,
                2.4
            ], [
                0.5,
                2.15,
                0
            ])
        ],
        stackedZoom: 0.95,
        // A câmera também só anda entre os cards
        holdWindow: [
            0.06,
            0.94
        ],
        shadow: {
            center: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](2, 0, 0),
            size: 12
        },
        update
    };
}
function createWorld(canvas, { onReady }) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStage"])(canvas, {
        build,
        onReady
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_lib_0-tawyb._.js.map