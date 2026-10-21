// Motor das cenas 3D do portfólio. Cada cena (introdução, requisição do e-Move)
// monta seus objetos com build() e devolve as posições da câmera e um update(s).
// O motor cuida do resto: renderizador, luz, chão, cores do tema, tamanho,
// ponteiro e redesenho só quando algo muda.
import {
    BoxGeometry,
    Color,
    CylinderGeometry,
    DirectionalLight,
    Fog,
    HemisphereLight,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PlaneGeometry,
    Scene,
    SRGBColorSpace,
    Vector3,
    WebGLRenderer,
} from 'three';

export const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
export const span = (v, a, b) => clamp01((v - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);

export function box(w, h, d, material) {
    const mesh = new Mesh(new BoxGeometry(w, h, d), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

export function cylinder(r, h, material) {
    const mesh = new Mesh(new CylinderGeometry(r, r, h, 48), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

export function readTokens() {
    const css = getComputedStyle(document.documentElement);
    const get = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
    return {
        ground: get('--ground', '#0a0a0a'),
        paper: get('--paper', '#141416'),
        floor: get('--scene-floor', '#101012'),
        body: get('--scene-body', '#2a2a30'),
        dim: get('--scene-dim', '#3c3c44'),
        accent: get('--accent', '#3b82f6'),
        ink: get('--ink', '#ededed'),
        muted: get('--muted', '#a1a1aa'),
    };
}

// keys: [{ s, pos, look, hold }] em ordem de s. Entre duas paradas (hold) a câmera
// só anda dentro de window (fração do trecho); nos trechos livres ela anda o tempo todo.
function cameraAt(keys, s, pos, look, [from, to] = [0.1, 0.9]) {
    let i = 0;
    while (i < keys.length - 2 && s > keys[i + 1].s) i++;
    const a = keys[i];
    const b = keys[i + 1];
    const u = span(s, a.s, b.s);
    const e = a.hold && b.hold ? smooth(span(u, from, to)) : smooth(u);
    pos.lerpVectors(a.pos, b.pos, e);
    look.lerpVectors(a.look, b.look, e);
}

export function createStage(canvas, { build, onReady }) {
    let renderer;
    try {
        renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch {
        return null;
    }

    // Até 1024px o canvas ocupa a metade de cima e o texto fica embaixo
    const stacked = window.matchMedia('(max-width: 1024px)');
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;

    const scene = new Scene();
    const camera = new PerspectiveCamera(36, 1, 0.1, 200);
    const tokens = readTokens();

    const mats = {
        floor: new MeshStandardMaterial({ roughness: 1 }),
        body: new MeshStandardMaterial({ roughness: 0.55, metalness: 0.08 }),
        dim: new MeshStandardMaterial({ roughness: 0.7 }),
        accent: new MeshStandardMaterial({ roughness: 0.4 }),
        ink: new MeshStandardMaterial({ roughness: 0.4 }),
        route: new MeshBasicMaterial(),
        routeLit: new MeshBasicMaterial(),
        returnLit: new MeshBasicMaterial(),
        led: new MeshBasicMaterial(),
    };

    const hemi = new HemisphereLight(0xffffff, 0x444444, 1.9);
    const sun = new DirectionalLight(0xffffff, 2.4);
    sun.castShadow = true;
    const mapSize = stacked.matches ? 1024 : 2048;
    sun.shadow.mapSize.set(mapSize, mapSize);
    sun.shadow.radius = 4;
    scene.add(hemi, sun, sun.target);

    const floor = new Mesh(new PlaneGeometry(400, 400), mats.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const world = build({ scene, mats, tokens, stacked });

    // A sombra cobre a área da cena: centro e meia largura vêm do mundo
    const { center, size } = world.shadow;
    sun.position.set(center.x - 10, 20, center.z + 14);
    sun.target.position.copy(center);
    Object.assign(sun.shadow.camera, { left: -size, right: size, top: size * 0.85, bottom: -size * 0.85, near: 1, far: 70 });
    sun.shadow.camera.updateProjectionMatrix();

    const applyTokens = () => {
        Object.assign(tokens, readTokens());
        scene.background = new Color(tokens.ground);
        scene.fog = new Fog(tokens.ground, 46, 110);
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

    const pos = new Vector3();
    const look = new Vector3();

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
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let visible = true;
    let raf = 0;
    let first = true;
    let moving = false;

    function tick(time) {
        raf = requestAnimationFrame(tick);
        if (!visible) return;
        const dp = target - progress;
        if (Math.abs(dp) > 0.00005) { progress += dp * 0.07; dirty = true; } else if (progress !== target) { progress = target; dirty = true; }
        const dx = pointer.tx - pointer.x;
        const dy = pointer.ty - pointer.y;
        if (Math.abs(dx) + Math.abs(dy) > 0.0005) { pointer.x += dx * 0.06; pointer.y += dy * 0.06; dirty = true; }
        if (!dirty && !moving) return;
        dirty = false;
        const s = progress * world.beats;
        // update devolve true enquanto algo se move sozinho (peças flutuando na abertura)
        moving = !!world.update(s, time / 1000);
        place(s, pointer.x, pointer.y);
        renderer.render(scene, camera);
        if (first) { first = false; onReady?.(); }
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const themeObserver = new MutationObserver(() => { applyTokens(); dirty = true; });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const viewObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    viewObserver.observe(canvas);
    resize();
    raf = requestAnimationFrame(tick);

    return {
        setProgress(p) {
            target = clamp01(p);
        },
        setPointer(x, y) {
            pointer.tx = x;
            pointer.ty = y;
        },
        dispose() {
            cancelAnimationFrame(raf);
            resizeObserver.disconnect();
            themeObserver.disconnect();
            viewObserver.disconnect();
            world.dispose?.();
            scene.traverse((obj) => obj.geometry?.dispose());
            Object.values(mats).forEach((m) => m.dispose());
            renderer.dispose();
        },
    };
}
