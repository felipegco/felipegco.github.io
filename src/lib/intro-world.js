// Cena 3D da introdução, "do hardware à API":
// 0 peças na bancada · 1 o gabinete montado (Marino) · 2 o gabinete deitado num rack (Brascabos)
// · 3 o rack aceso e uma requisição saindo para a cena do e-Move.
import {
    BoxGeometry,
    Color,
    CubicBezierCurve3,
    EdgesGeometry,
    Euler,
    Group,
    LineBasicMaterial,
    LineSegments,
    Mesh,
    MeshStandardMaterial,
    QuadraticBezierCurve3,
    Quaternion,
    TubeGeometry,
    Vector3,
} from 'three';
import { box, createStage, cylinder, smooth, span } from '@/lib/scene-engine';

// O gabinete tem o centro na origem; o lado aberto olha para +z
const TOWER_Y = 2.2;
const SLOT_Y = 2.15;

// O gabinete já está de pé: [nome, [largura, altura, profundidade], posição]
const CASE = [
    ['back', [4.2, 4.4, 0.08], [0, 0, -0.96]],
    ['top', [4.2, 0.08, 2], [0, 2.16, 0]],
    ['bottom', [4.2, 0.08, 2], [0, -2.16, 0]],
    ['front', [0.08, 4.4, 2], [2.06, 0, 0]],
    ['rear', [0.08, 4.4, 2], [-2.06, 0, 0]],
];

// As peças de dentro começam deitadas numa bancada na frente do gabinete e entram
// uma por vez, de trás para frente, para nenhuma passar por dentro de outra já encaixada.
// [nome, [largura, altura, profundidade], encaixe, lugar na bancada (x, z), como fica deitada, material]
const PARTS = [
    ['board', [3.0, 3.2, 0.06], [-0.3, 0.3, -0.88], [-1.9, 3.3], [-Math.PI / 2, 0, 0], 'dim'],
    ['cooler', [0.9, 0.9, 0.6], [-0.4, 0.9, -0.55], [0.35, 2.2], [-Math.PI / 2, 0, 0], 'body'],
    ['ram-1', [0.08, 1.2, 0.22], [0.45, 0.9, -0.74], [0.35, 4.55], [0, 0, Math.PI / 2], 'accent'],
    ['ram-2', [0.08, 1.2, 0.22], [0.67, 0.9, -0.74], [0.35, 4.9], [0, 0, Math.PI / 2], 'accent'],
    ['gpu', [2.4, 0.3, 0.9], [-0.5, -0.4, -0.4], [1.0, 3.45], [0, 0, 0], 'body'],
    ['ssd', [0.8, 0.06, 0.5], [1.3, -1.2, -0.5], [1.85, 4.75], [0, 0, 0], 'accent'],
    ['psu', [1.5, 1.0, 1.7], [-1.2, -1.6, 0], [2.0, 2.4], [0, 0, 0], 'body'],
];

// O tapete da bancada, no chão na frente do gabinete; as peças altas ficam atrás, as baixas na frente
const MAT = { w: 6.6, d: 4.7, h: 0.03, x: -0.4, z: 3.75 };

// A montagem tem relógio próprio: começa quando a abertura sai de cena e leva ASSEMBLY
// segundos, mesmo que o card do hardware já esteja na tela. Em frações da montagem,
// cada peça leva STEP_LEN e a seguinte começa STEP_GAP depois.
const ASSEMBLY = 4;
const ASSEMBLY_AT = 0.12;
const STEP_LEN = 0.3;
const STEP_GAP = (1 - STEP_LEN) / (PARTS.length - 1);

// Ventoinhas: deixam a placa de vídeo, o cooler e a fonte reconhecíveis
const FANS = [
    ['gpu', 0.32, [-0.6, 0.17, 0], 'y'],
    ['gpu', 0.32, [0.6, 0.17, 0], 'y'],
    ['cooler', 0.38, [0, 0, 0.31], 'z'],
    ['psu', 0.36, [0, 0.51, 0.2], 'y'],
];

const UNIT_YS = [0.35, 0.85, 1.35, 2.95, 3.45];

function build({ scene, mats, tokens }) {
    const machine = new Group();
    machine.position.set(0, TOWER_Y, 0);
    const meshes = {};

    CASE.forEach(([name, [w, h, d], at]) => {
        const mesh = box(w, h, d, mats.body);
        mesh.position.set(...at);
        machine.add(mesh);
        meshes[name] = mesh;
    });

    // Contorno azul de cada encaixe: mostra para onde a peça vai e some quando ela chega
    const ghostMat = new LineBasicMaterial({ color: tokens.accent, transparent: true, opacity: 0.6, depthWrite: false });

    const parts = PARTS.map(([name, [w, h, d], at, [benchX, benchZ], flat, mat], i) => {
        const mesh = box(w, h, d, mats[mat]);
        machine.add(mesh);
        meshes[name] = mesh;

        const lying = new Quaternion().setFromEuler(new Euler(...flat));
        // A altura da peça deitada, para ela ficar apoiada no tapete
        const tall = new Vector3(w, h, d).applyQuaternion(lying);
        const end = new Vector3(...at);
        const start = new Vector3(benchX, -TOWER_Y + MAT.h + Math.abs(tall.y) / 2, benchZ);
        // Sobe reto da bancada e entra de frente pelo lado aberto
        const path = new CubicBezierCurve3(
            start,
            start.clone().add(new Vector3(0, 1.8, 0)),
            end.clone().add(new Vector3(0, 0.3, 3.2)),
            end,
        );

        const ghost = new LineSegments(new EdgesGeometry(mesh.geometry), ghostMat);
        ghost.position.copy(end);
        machine.add(ghost);

        const from = i * STEP_GAP;
        return { mesh, path, lying, ghost, from, to: from + STEP_LEN };
    });

    FANS.forEach(([name, r, at, axis]) => {
        const fan = cylinder(r, 0.05, mats.dim);
        if (axis === 'z') fan.rotation.x = Math.PI / 2;
        fan.position.set(...at);
        meshes[name].add(fan);
    });

    const matMat = new MeshStandardMaterial({ roughness: 1, color: new Color(tokens.floor).lerp(new Color(tokens.body), 0.4) });
    const bench = box(MAT.w, MAT.h, MAT.d, matMat);
    bench.castShadow = false;
    bench.position.set(MAT.x, MAT.h / 2, MAT.z);

    // A tampa fecha o lado aberto antes de o gabinete virar servidor
    const lid = box(4.2, 4.4, 0.06, mats.body);
    machine.add(lid);
    const lidAt = new Vector3(0, 0, 1.0);
    const lidFrom = new Vector3(0, 0, 4.0);

    // O LED fica na frente; depois de deitado, a frente olha para a câmera
    const machineLed = new Mesh(new BoxGeometry(0.05, 0.14, 0.4), mats.led);
    machineLed.position.set(2.12, 1.4, 0.4);
    machine.add(machineLed);

    // Deitar o gabinete: primeiro o lado aberto vira para cima, depois a frente vira para +z
    const upright = new Quaternion();
    const lying = new Quaternion().setFromEuler(new Euler(0, -Math.PI / 2, 0))
        .multiply(new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0)));

    // Rack aberto na frente, com cinco servidores e uma vaga de 2U no meio
    const rack = new Group();
    const sideL = box(0.12, 3.9, 2.4, mats.body);
    sideL.position.set(-1.26, 1.95, 0);
    const sideR = sideL.clone();
    sideR.position.x = 1.26;
    const rackTop = box(2.64, 0.12, 2.4, mats.body);
    rackTop.position.set(0, 3.96, 0);
    const rackBack = box(2.64, 3.9, 0.1, mats.body);
    rackBack.position.set(0, 1.95, -1.2);
    rack.add(sideL, sideR, rackTop, rackBack);
    const leds = UNIT_YS.map((y) => {
        const unit = box(2.2, 0.42, 2.1, mats.dim);
        unit.position.set(0, y, 0);
        const led = new Mesh(new BoxGeometry(0.3, 0.1, 0.04), mats.led);
        led.position.set(0.75, y, 1.07);
        rack.add(unit, led);
        return led;
    });

    // O cabo por onde sai a primeira requisição, rumo à cena do e-Move
    const cable = new QuadraticBezierCurve3(new Vector3(1.1, SLOT_Y, 1.1), new Vector3(5, 0.35, 3), new Vector3(16, 0.35, 1));
    const TUBE = 100;
    const RADIAL = 8;
    const cableBase = new Mesh(new TubeGeometry(cable, TUBE, 0.035, RADIAL, false), mats.route);
    const cableLit = new Mesh(new TubeGeometry(cable, TUBE, 0.055, RADIAL, false), mats.routeLit);
    const packet = box(0.52, 0.34, 0.34, mats.accent);

    scene.add(machine, bench, rack, cableBase, cableLit, packet);

    const tmp = new Vector3();
    const upright0 = new Quaternion();
    let assembled = 0;
    let last = null;
    const ahead = new Vector3();

    function update(s, time) {
        // Os cards aparecem a ±0,12 de cada parada; tudo se move só no intervalo entre eles,
        // então cada card mostra a cena parada.
        // 0 → 1: a exceção. Depois que a abertura some, as peças saem da bancada uma por vez
        // no relógio da montagem, não no da rolagem; voltando para a abertura, elas voltam
        // para a bancada. Se a página já chega mais adiante (um link para a trajetória),
        // o gabinete aparece montado.
        // Enquanto algum encaixe espera a peça, o contorno pulsa devagar.
        const dt = last === null ? 0 : Math.min(time - last, 0.1);
        last = time;
        const goal = s > ASSEMBLY_AT ? 1 : 0;
        if (s > 1.05) assembled = 1;
        else assembled = Math.min(Math.max(assembled + Math.sign(goal - assembled) * (dt / ASSEMBLY), 0), 1);

        let waiting = assembled !== goal;
        const pulse = 0.45 + 0.2 * Math.sin(time * 2.4);
        parts.forEach((p) => {
            const f = smooth(span(assembled, p.from, p.to));
            p.mesh.position.copy(p.path.getPoint(f));
            p.mesh.quaternion.slerpQuaternions(p.lying, upright0, smooth(span(f, 0.15, 0.75)));
            p.ghost.visible = f < 0.98;
            if (p.ghost.visible) waiting = true;
        });
        ghostMat.opacity = pulse;

        // 1 → 2: com o card do hardware fora da tela, a tampa aparece e fecha,
        // o gabinete deita e o rack desliza em volta dele
        // O trecho ocupa quase o caminho todo: o deslize freia no fim, então a virada
        // e o rack precisam de espaço para não acontecer de uma vez
        const fLid = smooth(span(s, 1.12, 1.4));
        lid.visible = s > 1.12;
        lid.position.lerpVectors(lidFrom, lidAt, fLid);

        const fTurn = smooth(span(s, 1.3, 1.7));
        machine.quaternion.slerpQuaternions(upright, lying, fTurn);
        machine.scale.setScalar(1 - fTurn * 0.5);
        machine.position.y = TOWER_Y + (SLOT_Y - TOWER_Y) * fTurn;

        const fRack = smooth(span(s, 1.5, 1.88));
        rack.visible = s > 1.48;
        rack.position.z = -9 * (1 - fRack);

        // 2 → 3: os servidores acendem e a requisição sai pelo cabo
        leds.forEach((led, i) => { led.material = s > 2.36 + i * 0.03 ? mats.accent : mats.led; });
        machineLed.material = s > 2.34 ? mats.accent : mats.led;

        const fCable = smooth(span(s, 2.4, 2.6));
        cableBase.visible = s > 2.34;
        cableLit.geometry.setDrawRange(0, Math.floor(fCable * TUBE) * RADIAL * 6);
        const fPacket = smooth(span(s, 2.44, 2.66));
        packet.visible = s > 2.44 && fPacket < 0.97;
        packet.position.copy(cable.getPoint(fPacket));
        ahead.copy(cable.getPoint(Math.min(fPacket + 0.01, 1))).sub(packet.position);
        if (ahead.lengthSq() > 1e-8) packet.lookAt(tmp.copy(packet.position).add(ahead));

        return waiting;
    }

    const key = (s, pos, look) => ({ s, pos: new Vector3(...pos), look: new Vector3(...look), hold: true });

    return {
        // 0–3 as paradas; 3 → 4 a saída, enquanto os projetos sobem por cima
        beats: 4,
        keys: [
            key(0, [-2.0, 4.4, 17.5], [-0.3, 1.9, 0.6]),
            key(1, [3.4, 4.2, 12], [0, 2.1, 0]),
            key(2, [-3.4, 3.6, 10.5], [0, 2.0, 0]),
            key(3, [2.2, 3.8, 12], [3.0, 1.7, 0.5]),
            // Saída: a câmera entra no servidor aceso
            key(4, [0.7, 2.25, 2.4], [0.5, 2.15, 0]),
        ],
        stackedZoom: 0.95,
        // A câmera também só anda entre os cards
        holdWindow: [0.06, 0.94],
        shadow: { center: new Vector3(2, 0, 0), size: 12 },
        update,
        dispose() {
            ghostMat.dispose();
            matMat.dispose();
        },
    };
}

export function createWorld(canvas, { onReady }) {
    return createStage(canvas, { build, onReady });
}
