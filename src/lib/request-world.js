// Cena 3D da viagem de uma requisição do e-Move:
// navegador → container → controller → service → banco → resposta.
// Tudo é função do progresso da rolagem, então a cena só redesenha quando ele muda.
import {
    BoxGeometry,
    CanvasTexture,
    CubicBezierCurve3,
    Group,
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    QuadraticBezierCurve3,
    SRGBColorSpace,
    TubeGeometry,
    Vector3,
} from 'three';
import { box, createStage, cylinder, smooth, span } from '@/lib/scene-engine';

const STOPS = [
    [0, 0, 0],
    [9, 0, -5],
    [18, 0, 0],
    [27, 0, -5],
    [36, 0, 0],
].map(([x, y, z]) => new Vector3(x, y, z));

// Onde o pacote para em cada objeto; no navegador ele espera ao lado do notebook
const ANCHORS = STOPS.map((s, i) => s.clone().add(i === 0 ? new Vector3(1.6, 0.3, -0.5) : new Vector3(0, 0.9, 0)));

// Câmera em cada parada: posição relativa ao objeto, alternando os lados
const CAMERA_OFFSETS = [
    [-2.2, 2.0, 7.6],
    [2.4, 1.8, 7.4],
    [-2.4, 2.4, 7.2],
    [2.0, 1.4, 6.6],
    [-2.6, 2.2, 7.8],
];

function cameraKeys() {
    const keys = STOPS.map((stop, i) => {
        const look = stop.clone().add(new Vector3(0, 1.2, 0));
        return { s: i, look, pos: look.clone().add(new Vector3(...CAMERA_OFFSETS[i])), hold: true };
    });
    // A resposta sobe num arco por cima de tudo: a câmera abre para mostrar o caminho inteiro
    keys.push({ s: 4.5, look: new Vector3(18, 1, -2), pos: new Vector3(18, 17, 30), hold: false });
    const home = STOPS[0].clone().add(new Vector3(0, 1.2, 0));
    keys.push({ s: 5, look: home, pos: home.clone().add(new Vector3(-1.4, 2.8, 8.2)), hold: true });
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
    const screenTexture = new CanvasTexture(screenCanvas);
    screenTexture.colorSpace = SRGBColorSpace;
    screenTexture.anisotropy = 4;
    const screenMat = new MeshBasicMaterial({ map: screenTexture, toneMapped: false });

    const laptop = new Group();
    const base = box(3.4, 0.12, 2.3, mats.body);
    base.position.y = 0.06;
    const hinge = new Group();
    hinge.position.set(0, 0.12, -1.1);
    hinge.rotation.x = -0.2;
    const lid = box(3.4, 2.2, 0.08, mats.body);
    lid.position.y = 1.1;
    const face = new Mesh(new PlaneGeometry(3.2, 2.0), screenMat);
    face.position.set(0, 1.1, 0.042);
    hinge.add(lid, face);
    laptop.add(base, hinge);
    laptop.position.copy(STOPS[0]);
    laptop.rotation.y = 0.32;

    // 1 · Rack com o container; a unidade acesa é a que roda o app.jar
    const rack = new Group();
    const cabinet = box(2, 3.6, 1.8, mats.body);
    cabinet.position.y = 1.8;
    rack.add(cabinet);
    for (let i = 0; i < 7; i++) {
        const y = 0.36 + i * 0.48;
        const unit = box(1.76, 0.38, 0.06, mats.dim);
        unit.position.set(0, y, 0.92);
        const led = new Mesh(new BoxGeometry(0.1, 0.1, 0.04), i === 1 ? mats.accent : mats.led);
        led.position.set(0.7, y, 0.96);
        rack.add(unit, led);
    }
    rack.position.copy(STOPS[1]);
    rack.rotation.y = -0.3;

    // Trechos do caminho de ida, um por par de paradas
    const segments = [];
    for (let k = 0; k < 4; k++) {
        const a = ANCHORS[k];
        const b = ANCHORS[k + 1];
        const mid = a.clone().lerp(b, 0.5).add(new Vector3(0, 1.4, 0));
        segments.push(new QuadraticBezierCurve3(a, mid, b));
    }
    const returnCurve = new CubicBezierCurve3(
        ANCHORS[4].clone(),
        new Vector3(31, 9, 4),
        new Vector3(6, 9, 4),
        ANCHORS[0].clone(),
    );

    const TUBE = 120;
    const RADIAL = 8;
    const tube = (curve, radius, material) => new Mesh(new TubeGeometry(curve, TUBE, radius, RADIAL, false), material);
    const litTubes = segments.map((curve) => {
        scene.add(tube(curve, 0.035, mats.route));
        const lit = tube(curve, 0.055, mats.routeLit);
        scene.add(lit);
        return lit;
    });
    scene.add(tube(returnCurve, 0.035, mats.route));
    const returnLit = tube(returnCurve, 0.055, mats.returnLit);
    scene.add(returnLit);
    const drawTube = (mesh, f) => mesh.geometry.setDrawRange(0, Math.floor(f * TUBE) * RADIAL * 6);

    // Filtro de segurança: um portal no caminho entre o container e o controller
    const gate = new Group();
    const gateLintel = box(2.1, 0.16, 0.16, mats.body);
    gateLintel.position.y = 2.5;
    const postL = box(0.16, 2.5, 0.16, mats.body);
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
    const controller = new Group();
    const block = box(3, 1.2, 2, mats.body);
    block.position.y = 0.6;
    controller.add(block);
    for (let i = 0; i < 5; i++) {
        const port = cylinder(0.18, 0.3, i === 4 ? mats.accent : mats.dim);
        port.position.set(-1 + i * 0.5, 1.35, 0.25);
        controller.add(port);
    }
    controller.position.copy(STOPS[2]);
    controller.rotation.y = 0.18;

    // 3 · Service: a bateria que enche até 80% quando a regra roda
    const battery = new Group();
    const cells = [];
    for (let i = 0; i < 10; i++) {
        const cell = cylinder(0.64, 0.2, mats.dim);
        cell.position.y = 0.12 + i * 0.25;
        cells.push(cell);
        battery.add(cell);
    }
    const terminal = cylinder(0.24, 0.2, mats.body);
    terminal.position.y = 2.6;
    battery.add(terminal);
    battery.position.copy(STOPS[3]);

    // 4 · Banco: três discos; o de cima acende quando o save grava
    const database = new Group();
    const disks = [0, 1, 2].map((i) => {
        const disk = cylinder(1.15, 0.62, mats.body);
        disk.position.y = 0.31 + i * 0.78;
        database.add(disk);
        return disk;
    });
    database.position.copy(STOPS[4]);

    const packet = box(0.52, 0.34, 0.34, mats.accent);
    scene.add(laptop, rack, gate, controller, battery, database, packet);

    let answered = null;
    const paintScreen = () => {
        drawScreen(screenCtx, tokens, labels, !!answered);
        screenTexture.needsUpdate = true;
    };

    const ahead = new Vector3();

    function update(s) {
        segments.forEach((curve, k) => drawTube(litTubes[k], smooth(span(s - k, 0.2, 0.8))));
        const back = smooth(span(s - 4, 0.15, 0.85));
        drawTube(returnLit, back);

        if (s < 4) {
            const k = Math.min(Math.floor(s), 3);
            const f = smooth(span(s - k, 0.2, 0.8));
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

        const gateLit = s >= 2 || smooth(span(s - 1, 0.2, 0.8)) >= GATE_AT;
        gateLintel.material = gateLit ? mats.accent : mats.body;

        const lit = Math.round(8 * smooth(span(s, 2.78, 3.0)));
        cells.forEach((cell, i) => { cell.material = i < lit ? mats.accent : mats.dim; });

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
        shadow: { center: new Vector3(18, 0, -2), size: 26 },
        update,
        onTokens: paintScreen,
        dispose() {
            screenMat.dispose();
            screenTexture.dispose();
        },
    };
}

export function createWorld(canvas, { labels, onReady }) {
    return createStage(canvas, { build: (ctx) => build(ctx, labels), onReady });
}
