// Cena 3D da introdução, "do hardware à API":
// 0 peças soltas · 1 o gabinete montado (Marino) · 2 o gabinete deitado num rack (Brascabos)
// · 3 o rack aceso e uma requisição saindo para a cena do e-Move.
import { BoxGeometry, Euler, Group, Mesh, QuadraticBezierCurve3, Quaternion, TubeGeometry, Vector3 } from 'three';
import { box, createStage, cylinder, smooth, span } from '@/lib/scene-engine';

// O gabinete tem o centro na origem; o lado aberto olha para +z
const TOWER_Y = 2.2;
const SLOT_Y = 2.15;

// O gabinete já está de pé; só as peças de dentro começam soltas, na frente dele.
// [nome, [largura, altura, profundidade], posição final, deslocamento solto, rotação solta, material]
const PARTS = [
    ['back', [4.2, 4.4, 0.08], [0, 0, -0.96], [0, 0, 0], [0, 0, 0], 'body'],
    ['top', [4.2, 0.08, 2], [0, 2.16, 0], [0, 0, 0], [0, 0, 0], 'body'],
    ['bottom', [4.2, 0.08, 2], [0, -2.16, 0], [0, 0, 0], [0, 0, 0], 'body'],
    ['front', [0.08, 4.4, 2], [2.06, 0, 0], [0, 0, 0], [0, 0, 0], 'body'],
    ['rear', [0.08, 4.4, 2], [-2.06, 0, 0], [0, 0, 0], [0, 0, 0], 'body'],
    ['board', [3.0, 3.2, 0.06], [-0.3, 0.3, -0.88], [0.2, 1.9, 0.8], [0.35, 0.25, 0.05], 'dim'],
    ['cooler', [0.9, 0.9, 0.6], [-0.4, 0.9, -0.55], [1.2, 1.0, 2.8], [0.8, 0.4, 0.3], 'body'],
    ['ram-1', [0.08, 1.2, 0.22], [0.45, 0.9, -0.74], [1.7, 0.6, 2.9], [0.2, 0.9, 0.6], 'accent'],
    ['ram-2', [0.08, 1.2, 0.22], [0.67, 0.9, -0.74], [2.1, 0.1, 2.6], [0.5, 0.7, 0.2], 'accent'],
    ['gpu', [2.4, 0.3, 0.9], [-0.5, -0.4, -0.4], [-1.4, -0.9, 3.0], [0.5, -0.5, 0.3], 'body'],
    ['psu', [1.5, 1.0, 1.7], [-1.2, -1.6, 0], [-2.4, -0.4, 1.9], [0.2, 0.5, 0], 'body'],
    ['ssd', [0.8, 0.06, 0.5], [1.3, -1.2, -0.5], [1.9, -1.2, 2.8], [0.6, 0.3, 0.4], 'accent'],
];

// Ventoinhas: deixam a placa de vídeo, o cooler e a fonte reconhecíveis
const FANS = [
    ['gpu', 0.32, [-0.6, 0.17, 0], 'y'],
    ['gpu', 0.32, [0.6, 0.17, 0], 'y'],
    ['cooler', 0.38, [0, 0, 0.31], 'z'],
    ['psu', 0.36, [0, 0.51, 0.2], 'y'],
];

const UNIT_YS = [0.35, 0.85, 1.35, 2.95, 3.45];

function build({ scene, mats }) {
    const machine = new Group();
    machine.position.set(0, TOWER_Y, 0);

    const parts = PARTS.map(([name, [w, h, d], at, loose, turn, mat], i) => {
        const mesh = box(w, h, d, mats[mat]);
        machine.add(mesh);
        return {
            mesh,
            at: new Vector3(...at),
            loose: new Vector3(...at).add(new Vector3(...loose)),
            turn: new Vector3(...turn),
            delay: i * 0.035,
            phase: i * 1.7,
        };
    });

    FANS.forEach(([name, r, at, axis]) => {
        const part = parts[PARTS.findIndex(([n]) => n === name)].mesh;
        const fan = cylinder(r, 0.05, mats.dim);
        if (axis === 'z') fan.rotation.x = Math.PI / 2;
        fan.position.set(...at);
        part.add(fan);
    });

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

    scene.add(machine, rack, cableBase, cableLit, packet);

    const tmp = new Vector3();
    const ahead = new Vector3();

    function update(s, time) {
        // 0 → 1: as peças se encaixam, uma depois da outra
        let floating = false;
        parts.forEach((p) => {
            const f = smooth(span(s, 0.15 + p.delay, 0.75 + p.delay));
            const loose = 1 - f;
            if (loose > 0.001) floating = true;
            p.mesh.position.lerpVectors(p.loose, p.at, f);
            p.mesh.position.y += Math.sin(time * 0.9 + p.phase) * 0.14 * loose;
            p.mesh.rotation.set(
                p.turn.x * loose + Math.sin(time * 0.5 + p.phase) * 0.08 * loose,
                p.turn.y * loose,
                p.turn.z * loose,
            );
        });

        // 1 → 2: a tampa fecha, o gabinete deita e o rack desliza em volta dele
        const fLid = smooth(span(s, 1.05, 1.35));
        lid.visible = s > 1.02;
        lid.position.lerpVectors(lidFrom, lidAt, fLid);

        const fTurn = smooth(span(s, 1.25, 1.7));
        machine.quaternion.slerpQuaternions(upright, lying, fTurn);
        machine.scale.setScalar(1 - fTurn * 0.5);
        machine.position.y = TOWER_Y + (SLOT_Y - TOWER_Y) * fTurn;

        const fRack = smooth(span(s, 1.45, 1.95));
        rack.visible = s > 1.3;
        rack.position.z = -9 * (1 - fRack);

        // 2 → 3: os servidores acendem e a requisição sai pelo cabo
        leds.forEach((led, i) => { led.material = s > 2.1 + i * 0.08 ? mats.accent : mats.led; });
        machineLed.material = s > 2.05 ? mats.accent : mats.led;

        const fCable = smooth(span(s, 2.2, 2.85));
        cableBase.visible = s > 2.05;
        cableLit.geometry.setDrawRange(0, Math.floor(fCable * TUBE) * RADIAL * 6);
        const fPacket = smooth(span(s, 2.35, 3.0));
        packet.visible = s > 2.3 && fPacket < 0.97;
        packet.position.copy(cable.getPoint(fPacket));
        ahead.copy(cable.getPoint(Math.min(fPacket + 0.01, 1))).sub(packet.position);
        if (ahead.lengthSq() > 1e-8) packet.lookAt(tmp.copy(packet.position).add(ahead));

        return floating;
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
        shadow: { center: new Vector3(2, 0, 0), size: 12 },
        update,
    };
}

export function createWorld(canvas, { onReady }) {
    return createStage(canvas, { build, onReady });
}
