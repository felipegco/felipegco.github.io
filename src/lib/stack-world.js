// Cena 3D dos projetos: a stack de cada um, empilhada em camadas (o banco embaixo,
// o que o usuário vê em cima), com uma peça-assinatura do projeto no topo.
// Trocar de projeto desmonta a pilha atual de cima para baixo e monta a nova de baixo
// para cima, no mesmo gesto da montagem do gabinete na abertura.
import {
    BoxGeometry,
    CanvasTexture,
    CapsuleGeometry,
    ConeGeometry,
    CylinderGeometry,
    Group,
    Mesh,
    MeshStandardMaterial,
    SphereGeometry,
    SRGBColorSpace,
    TorusGeometry,
    Vector3,
} from 'three';
import { box, createStage, cylinder, smooth, span } from '@/lib/scene-engine';

const SLAB = { w: 3.2, h: 0.44, d: 2.2, gap: 0.06 };
const DROP = 7; // de que altura cada camada cai
const IN = 1.3; // segundos para montar uma pilha
const OUT = 0.55; // segundos para desmontar
const LAND = 0.45; // fração da montagem que cada camada leva para descer
const TURN = -0.5; // a pilha mostra a frente e um lado

// A etiqueta na frente de cada camada: o nome da tecnologia e o número da camada
function label(tokens, text, index, core) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    const font = getComputedStyle(document.body).fontFamily;
    ctx.fillStyle = core ? tokens.accent : tokens.body;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = core ? '#0a0a0a' : tokens.ink;
    ctx.font = `600 64px ${font}`;
    ctx.fillText(text, 56, 74);
    ctx.textAlign = 'right';
    ctx.fillStyle = core ? '#0a0a0a' : tokens.muted;
    ctx.font = `500 44px ${font}`;
    ctx.fillText(String(index + 1).padStart(2, '0'), canvas.width - 56, 74);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
}

// Peças-assinatura: cada uma devolve o grupo e, se tiver, o movimento contínuo dela
const TOPPERS = {
    // e-Move: o pino do mapa
    pin({ mats }) {
        const group = new Group();
        const tip = new Mesh(new ConeGeometry(0.3, 0.9, 32), mats.accent);
        tip.rotation.x = Math.PI;
        tip.position.y = 0.45;
        const head = new Mesh(new SphereGeometry(0.4, 32, 16), mats.accent);
        head.position.y = 1.05;
        const dot = new Mesh(new SphereGeometry(0.13, 16, 8), mats.ink);
        dot.position.set(0, 1.05, 0.33);
        tip.castShadow = head.castShadow = true;
        group.add(tip, head, dot);
        return { group, tick: (t) => { group.position.y = 0.12 + Math.sin(t * 1.6) * 0.08; } };
    },

    // GreenTech: a estufa
    greenhouse({ mats }) {
        const group = new Group();
        const walls = box(1.8, 0.6, 1.2, mats.body);
        walls.position.y = 0.3;
        // Telhado: um prisma triangular com a ponta para cima e o comprimento em z
        const roofGeometry = new CylinderGeometry(1.04, 1.04, 1.2, 3);
        roofGeometry.rotateX(-Math.PI / 2);
        const roof = new Mesh(roofGeometry, mats.accent);
        roof.scale.y = 0.5;
        roof.position.y = 0.6 + 0.26;
        roof.castShadow = true;
        const door = box(0.32, 0.42, 0.04, mats.dim);
        door.position.set(0, 0.21, 0.61);
        group.add(walls, roof, door);
        return { group };
    },

    // Triagem: o balão da conversa, com os três pontinhos de "digitando"
    chat({ mats }) {
        const group = new Group();
        const bubble = box(1.6, 0.95, 0.3, mats.accent);
        bubble.position.y = 0.78;
        const tail = new Mesh(new ConeGeometry(0.2, 0.4, 4), mats.accent);
        tail.position.set(-0.45, 0.24, 0);
        tail.rotation.z = 0.6;
        const dots = [-0.38, 0, 0.38].map((x) => {
            const dot = new Mesh(new SphereGeometry(0.1, 16, 8), mats.ink);
            dot.position.set(x, 0.78, 0.16);
            group.add(dot);
            return dot;
        });
        group.add(bubble, tail);
        return {
            group,
            tick: (t) => dots.forEach((dot, i) => { dot.position.y = 0.78 + Math.max(0, Math.sin(t * 4 - i * 0.9)) * 0.1; }),
        };
    },

    // CliniCare: a agenda, com um horário marcado
    calendar({ mats }) {
        const group = new Group();
        const page = box(1.5, 1.3, 0.16, mats.body);
        page.position.y = 0.7;
        const header = box(1.5, 0.3, 0.2, mats.accent);
        header.position.y = 1.2;
        group.add(page, header);
        for (const x of [-0.4, 0.4]) {
            const ring = cylinder(0.05, 0.22, mats.ink);
            ring.position.set(x, 1.4, 0);
            group.add(ring);
        }
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = box(0.24, 0.18, 0.04, row === 1 && col === 2 ? mats.accent : mats.dim);
                cell.position.set(-0.48 + col * 0.32, 0.86 - row * 0.26, 0.09);
                group.add(cell);
            }
        }
        return { group };
    },

    // Simple Notch: a tampa do MacBook, com a ilha que cresce e encolhe
    notch({ mats, own, tokens }) {
        const group = new Group();
        const screenMat = new MeshStandardMaterial({ color: tokens.paper, roughness: 0.3 });
        const islandMat = new MeshStandardMaterial({ color: '#050505', roughness: 0.4 });
        own.push(screenMat, islandMat);
        const base = box(2.4, 0.06, 1.5, mats.body);
        base.position.y = 0.03;
        const hinge = new Group();
        hinge.position.set(0, 0.06, -0.72);
        hinge.rotation.x = -0.18;
        const lid = box(2.4, 1.5, 0.06, mats.body);
        lid.position.y = 0.75;
        const screen = box(2.24, 1.36, 0.02, screenMat);
        screen.position.set(0, 0.75, 0.035);
        const island = new Mesh(new CapsuleGeometry(0.07, 0.22, 8, 16), islandMat);
        island.rotation.z = Math.PI / 2;
        island.position.set(0, 1.32, 0.05);
        hinge.add(lid, screen, island);
        group.add(base, hinge);
        return {
            group,
            tick: (t) => { island.scale.y = 1 + 2.2 * smooth(0.5 + 0.5 * Math.sin(t * 1.1)); },
        };
    },

    // Atoll: um atol, o anel baixo de areia em volta da lagoa, com um coqueiro
    atoll({ mats }) {
        const group = new Group();
        const lagoon = cylinder(0.7, 0.1, mats.accent);
        lagoon.position.y = 0.05;
        const ring = new Mesh(new TorusGeometry(0.85, 0.24, 16, 64), mats.ink);
        ring.rotation.x = -Math.PI / 2;
        ring.scale.z = 0.4;
        ring.position.y = 0.1;
        ring.castShadow = true;
        const palm = new Group();
        palm.position.set(0.62, 0.15, 0.55);
        const trunk = cylinder(0.045, 0.85, mats.body);
        trunk.position.y = 0.42;
        palm.add(trunk);
        // As folhas: cinco lâminas em volta do topo, caindo para fora
        for (let i = 0; i < 5; i++) {
            const arm = new Group();
            arm.position.y = 0.84;
            arm.rotation.y = (i / 5) * Math.PI * 2;
            const leaf = box(0.55, 0.03, 0.14, mats.dim);
            leaf.position.x = 0.24;
            leaf.rotation.z = -0.45;
            arm.add(leaf);
            palm.add(arm);
        }
        group.add(lagoon, ring, palm);
        return { group, tick: (t) => { palm.rotation.z = 0.16 + Math.sin(t * 1.3) * 0.05; } };
    },
};

function build(ctx, projects, still) {
    const { scene, mats, tokens, invalidate } = ctx;
    const own = []; // materiais e texturas da cena, liberados no dispose

    const tower = new Group();
    tower.rotation.y = TURN;
    scene.add(tower);

    // Uma pilha por projeto, montadas de antemão; só a do projeto atual aparece
    const stacks = projects.map(({ layers, core, topper }) => {
        const group = new Group();
        const items = layers.map((text, i) => {
            const isCore = i === core;
            const map = label(tokens, text, i, isCore);
            const front = new MeshStandardMaterial({ map, roughness: isCore ? 0.4 : 0.55, metalness: isCore ? 0 : 0.08 });
            own.push(map, front);
            const side = isCore ? mats.accent : mats.body;
            // BoxGeometry: +x, -x, +y, -y, +z (a frente, com a etiqueta), -z
            const slab = new Mesh(new BoxGeometry(SLAB.w, SLAB.h, SLAB.d), [side, side, side, side, front, side]);
            slab.castShadow = slab.receiveShadow = true;
            const holder = new Group();
            holder.position.y = SLAB.h / 2 + i * (SLAB.h + SLAB.gap);
            holder.add(slab);
            group.add(holder);
            return { holder, rest: holder.position.y };
        });

        let tick = null;
        if (TOPPERS[topper]) {
            const piece = TOPPERS[topper]({ mats, own, tokens });
            const holder = new Group();
            holder.position.y = layers.length * (SLAB.h + SLAB.gap);
            holder.add(piece.group);
            group.add(holder);
            items.push({ holder, rest: holder.position.y });
            tick = piece.tick;
        }

        group.visible = false;
        tower.add(group);
        return { group, items, tick, progress: 0 };
    });

    let current = 0;
    let last = null;

    function update(s, time) {
        const dt = last === null ? 0 : Math.min(time - last, 0.1);
        last = time;

        // As outras pilhas saem primeiro; a do projeto atual só começa a montar depois
        const clear = stacks.every((stack, i) => i === current || stack.progress === 0);
        stacks.forEach((stack, i) => {
            if (still) stack.progress = i === current ? 1 : 0;
            else if (i !== current) stack.progress = Math.max(stack.progress - dt / OUT, 0);
            else if (clear) stack.progress = Math.min(stack.progress + dt / IN, 1);

            stack.group.visible = stack.progress > 0;
            if (!stack.group.visible) return;
            const step = (1 - LAND) / Math.max(stack.items.length - 1, 1);
            stack.items.forEach((item, k) => {
                const f = smooth(span(stack.progress, k * step, k * step + LAND));
                item.holder.visible = f > 0;
                item.holder.position.y = item.rest + (1 - f) * DROP;
            });
            stack.tick?.(time);
        });

        if (!still) tower.rotation.y = TURN + Math.sin(time * 0.45) * 0.16;
        return !still;
    }

    const look = new Vector3(0, 1.75, 0);
    const pos = new Vector3(0, 4.2, 8.8);
    return {
        beats: 1,
        keys: [
            { s: 0, pos, look, hold: true },
            { s: 1, pos, look, hold: true },
        ],
        centered: true,
        stackedZoom: 0.78,
        shadow: { center: new Vector3(0, 0, 0), size: 4 },
        update,
        api: {
            setProject(i) {
                current = Math.min(Math.max(i, 0), stacks.length - 1);
                invalidate();
            },
        },
        dispose() {
            own.forEach((item) => item.dispose());
        },
    };
}

export function createWorld(canvas, { projects, still, onReady }) {
    return createStage(canvas, { build: (ctx) => build(ctx, projects, still), onReady, transparent: true });
}
