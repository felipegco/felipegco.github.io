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
"[project]/src/lib/request-world.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createWorld",
    ()=>createWorld
]);
// Cena 3D da viagem de uma requisição do e-Move:
// navegador → container → controller → service → banco → resposta.
// Tudo é função do progresso da rolagem, então a cena só redesenha quando ele muda.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/scene-engine.js [app-client] (ecmascript)");
;
;
const STOPS = [
    [
        0,
        0,
        0
    ],
    [
        9,
        0,
        -5
    ],
    [
        18,
        0,
        0
    ],
    [
        27,
        0,
        -5
    ],
    [
        36,
        0,
        0
    ]
].map(_c = ([x, y, z])=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](x, y, z));
_c1 = STOPS;
// Onde o pacote para em cada objeto; no navegador ele espera ao lado do notebook
const ANCHORS = STOPS.map(_c2 = (s, i)=>s.clone().add(i === 0 ? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](1.6, 0.3, -0.5) : new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](0, 0.9, 0)));
_c3 = ANCHORS;
// Câmera em cada parada: posição relativa ao objeto, alternando os lados
const CAMERA_OFFSETS = [
    [
        -2.2,
        2.0,
        7.6
    ],
    [
        2.4,
        1.8,
        7.4
    ],
    [
        -2.4,
        2.4,
        7.2
    ],
    [
        2.0,
        1.4,
        6.6
    ],
    [
        -2.6,
        2.2,
        7.8
    ]
];
function cameraKeys() {
    const keys = STOPS.map((stop, i)=>{
        const look = stop.clone().add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](0, 1.2, 0));
        return {
            s: i,
            look,
            pos: look.clone().add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](...CAMERA_OFFSETS[i])),
            hold: true
        };
    });
    // A resposta sobe num arco por cima de tudo: a câmera abre para mostrar o caminho inteiro
    keys.push({
        s: 4.5,
        look: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](18, 1, -2),
        pos: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](18, 17, 30),
        hold: false
    });
    const home = STOPS[0].clone().add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](0, 1.2, 0));
    keys.push({
        s: 5,
        look: home,
        pos: home.clone().add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](-1.4, 2.8, 8.2)),
        hold: true
    });
    return keys;
}
// Tela do e-Move no notebook, desenhada num canvas com a fonte da página
function drawScreen(ctx, tokens, labels, answered) {
    const { width: w } = ctx.canvas;
    const font = getComputedStyle(document.body).fontFamily;
    ctx.fillStyle = tokens.paper;
    ctx.fillRect(0, 0, w, ctx.canvas.height);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = tokens.accent;
    ctx.font = `700 46px ${font}`;
    ctx.fillText('e-Move', 64, 96);
    ctx.fillStyle = tokens.muted;
    ctx.font = `500 30px ${font}`;
    ctx.textAlign = 'right';
    ctx.fillText(labels.list, w - 64, 94);
    ctx.textAlign = 'left';
    ctx.fillStyle = tokens.ink;
    ctx.font = `700 68px ${font}`;
    ctx.fillText('Tesla Model 3', 64, 210);
    ctx.fillStyle = tokens.muted;
    ctx.font = `500 30px ${font}`;
    ctx.fillText(labels.battery, 64, 282);
    ctx.textAlign = 'right';
    ctx.fillStyle = tokens.ink;
    ctx.fillText('80%', w - 64, 282);
    ctx.textAlign = 'left';
    ctx.fillStyle = tokens.dim;
    ctx.fillRect(64, 304, w - 128, 30);
    ctx.fillStyle = tokens.accent;
    ctx.fillRect(64, 304, (w - 128) * 0.8, 30);
    ctx.fillStyle = tokens.muted;
    ctx.font = `500 30px ${font}`;
    ctx.fillText(labels.range, 64, 420);
    ctx.fillStyle = answered ? tokens.ink : tokens.dim;
    ctx.font = `700 96px ${font}`;
    ctx.fillText(answered ? `392${labels.decimal}8 km` : '— km', 64, 520);
    ctx.fillStyle = answered ? tokens.dim : tokens.accent;
    ctx.fillRect(w - 64 - 220, 452, 220, 76);
    ctx.fillStyle = answered ? tokens.ink : '#0a0a0a';
    ctx.font = `600 32px ${font}`;
    ctx.textAlign = 'center';
    ctx.fillText(answered ? labels.saved : labels.save, w - 64 - 110, 502);
    ctx.textAlign = 'left';
}
function build({ scene, mats, tokens }, labels) {
    // 0 · Notebook com o e-Move aberto
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 1024;
    screenCanvas.height = 640;
    const screenCtx = screenCanvas.getContext('2d');
    const screenTexture = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CanvasTexture"](screenCanvas);
    screenTexture.colorSpace = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SRGBColorSpace"];
    screenTexture.anisotropy = 4;
    const screenMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
        map: screenTexture,
        toneMapped: false
    });
    const laptop = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    const base = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["box"])(3.4, 0.12, 2.3, mats.body);
    base.position.y = 0.06;
    const hinge = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    hinge.position.set(0, 0.12, -1.1);
    hinge.rotation.x = -0.2;
    const lid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["box"])(3.4, 2.2, 0.08, mats.body);
    lid.position.y = 1.1;
    const face = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlaneGeometry"](3.2, 2.0), screenMat);
    face.position.set(0, 1.1, 0.042);
    hinge.add(lid, face);
    laptop.add(base, hinge);
    laptop.position.copy(STOPS[0]);
    laptop.rotation.y = 0.32;
    // 1 · Rack com o container; a unidade acesa é a que roda o app.jar
    const rack = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    const cabinet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["box"])(2, 3.6, 1.8, mats.body);
    cabinet.position.y = 1.8;
    rack.add(cabinet);
    for(let i = 0; i < 7; i++){
        const y = 0.36 + i * 0.48;
        const unit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["box"])(1.76, 0.38, 0.06, mats.dim);
        unit.position.set(0, y, 0.92);
        const led = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](0.1, 0.1, 0.04), i === 1 ? mats.accent : mats.led);
        led.position.set(0.7, y, 0.96);
        rack.add(unit, led);
    }
    rack.position.copy(STOPS[1]);
    rack.rotation.y = -0.3;
    // Trechos do caminho de ida, um por par de paradas
    const segments = [];
    for(let k = 0; k < 4; k++){
        const a = ANCHORS[k];
        const b = ANCHORS[k + 1];
        const mid = a.clone().lerp(b, 0.5).add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](0, 1.4, 0));
        segments.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QuadraticBezierCurve3"](a, mid, b));
    }
    const returnCurve = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CubicBezierCurve3"](ANCHORS[4].clone(), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](31, 9, 4), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](6, 9, 4), ANCHORS[0].clone());
    const TUBE = 120;
    const RADIAL = 8;
    const tube = (curve, radius, material)=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TubeGeometry"](curve, TUBE, radius, RADIAL, false), material);
    const litTubes = segments.map((curve)=>{
        scene.add(tube(curve, 0.035, mats.route));
        const lit = tube(curve, 0.055, mats.routeLit);
        scene.add(lit);
        return lit;
    });
    scene.add(tube(returnCurve, 0.035, mats.route));
    const returnLit = tube(returnCurve, 0.055, mats.returnLit);
    scene.add(returnLit);
    const drawTube = (mesh, f)=>mesh.geometry.setDrawRange(0, Math.floor(f * TUBE) * RADIAL * 6);
    // Filtro de segurança: um portal no caminho entre o container e o controller
    const gate = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    const gateLintel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["box"])(2.1, 0.16, 0.16, mats.body);
    gateLintel.position.y = 2.5;
    const postL = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["box"])(0.16, 2.5, 0.16, mats.body);
    postL.position.set(-0.97, 1.25, 0);
    const postR = postL.clone();
    postR.position.x = 0.97;
    gate.add(gateLintel, postL, postR);
    const GATE_AT = 0.82;
    const gatePoint = segments[1].getPoint(GATE_AT);
    const gateAhead = segments[1].getPoint(GATE_AT + 0.02);
    gate.position.set(gatePoint.x, 0, gatePoint.z);
    gate.lookAt(gateAhead.x, 0, gateAhead.z);
    // 2 · Controller: um bloco com os cinco endpoints do VeiculoController; o PUT /bateria é o azul
    const controller = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    const block = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["box"])(3, 1.2, 2, mats.body);
    block.position.y = 0.6;
    controller.add(block);
    for(let i = 0; i < 5; i++){
        const port = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cylinder"])(0.18, 0.3, i === 4 ? mats.accent : mats.dim);
        port.position.set(-1 + i * 0.5, 1.35, 0.25);
        controller.add(port);
    }
    controller.position.copy(STOPS[2]);
    controller.rotation.y = 0.18;
    // 3 · Service: a bateria que enche até 80% quando a regra roda
    const battery = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    const cells = [];
    for(let i = 0; i < 10; i++){
        const cell = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cylinder"])(0.64, 0.2, mats.dim);
        cell.position.y = 0.12 + i * 0.25;
        cells.push(cell);
        battery.add(cell);
    }
    const terminal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cylinder"])(0.24, 0.2, mats.body);
    terminal.position.y = 2.6;
    battery.add(terminal);
    battery.position.copy(STOPS[3]);
    // 4 · Banco: três discos; o de cima acende quando o save grava
    const database = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    const disks = [
        0,
        1,
        2
    ].map((i)=>{
        const disk = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cylinder"])(1.15, 0.62, mats.body);
        disk.position.y = 0.31 + i * 0.78;
        database.add(disk);
        return disk;
    });
    database.position.copy(STOPS[4]);
    const packet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["box"])(0.52, 0.34, 0.34, mats.accent);
    scene.add(laptop, rack, gate, controller, battery, database, packet);
    let answered = null;
    const paintScreen = ()=>{
        drawScreen(screenCtx, tokens, labels, !!answered);
        screenTexture.needsUpdate = true;
    };
    const ahead = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]();
    function update(s) {
        segments.forEach((curve, k)=>drawTube(litTubes[k], (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["smooth"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["span"])(s - k, 0.2, 0.8))));
        const back = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["smooth"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["span"])(s - 4, 0.15, 0.85));
        drawTube(returnLit, back);
        if (s < 4) {
            const k = Math.min(Math.floor(s), 3);
            const f = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["smooth"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["span"])(s - k, 0.2, 0.8));
            packet.position.copy(segments[k].getPoint(f));
            ahead.copy(segments[k].getPoint(Math.min(f + 0.01, 1))).sub(packet.position);
            packet.material = mats.accent;
        } else {
            packet.position.copy(returnCurve.getPoint(back));
            ahead.copy(returnCurve.getPoint(Math.min(back + 0.01, 1))).sub(packet.position);
            packet.material = s - 4 > 0.08 ? mats.ink : mats.accent;
        }
        // Ao chegar, a resposta entra no notebook e a tela mostra o resultado
        packet.visible = back < 0.97;
        if (ahead.lengthSq() > 1e-8) packet.lookAt(ahead.add(packet.position));
        const gateLit = s >= 2 || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["smooth"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["span"])(s - 1, 0.2, 0.8)) >= GATE_AT;
        gateLintel.material = gateLit ? mats.accent : mats.body;
        const lit = Math.round(8 * (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["smooth"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["span"])(s, 2.78, 3.0)));
        cells.forEach((cell, i)=>{
            cell.material = i < lit ? mats.accent : mats.dim;
        });
        const writing = s > 3.8 && s < 4.18;
        disks[2].material = writing ? mats.accent : mats.body;
        const isAnswered = s > 4.85;
        if (isAnswered !== answered) {
            answered = isAnswered;
            paintScreen();
        }
        return false;
    }
    return {
        beats: 5,
        keys: cameraKeys(),
        shadow: {
            center: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](18, 0, -2),
            size: 26
        },
        update,
        onTokens: paintScreen,
        dispose () {
            screenMat.dispose();
            screenTexture.dispose();
        }
    };
}
function createWorld(canvas, { labels, onReady }) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$scene$2d$engine$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStage"])(canvas, {
        build: (ctx)=>build(ctx, labels),
        onReady
    });
}
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "STOPS$[\n    [0, 0, 0],\n    [9, 0, -5],\n    [18, 0, 0],\n    [27, 0, -5],\n    [36, 0, 0],\n].map");
__turbopack_context__.k.register(_c1, "STOPS");
__turbopack_context__.k.register(_c2, "ANCHORS$STOPS.map");
__turbopack_context__.k.register(_c3, "ANCHORS");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_lib_1xh3962._.js.map