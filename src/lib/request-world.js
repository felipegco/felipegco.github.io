// Cena 3D de como o e-Move planeja uma viagem de carro elétrico:
// notebook → bateria → pinos no mapa → rota com reserva → estações → viagem feita.
// O mapa é abstrato (quarteirões e ruas sem cidade), mas as contas são as do e-Move.
// Tudo é função do progresso da rolagem, então a cena só redesenha quando ele muda.
import {
    CanvasTexture,
    CatmullRomCurve3,
    CircleGeometry,
    Color,
    ConeGeometry,
    Curve,
    DoubleSide,
    Group,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    PlaneGeometry,
    RingGeometry,
    SphereGeometry,
    SRGBColorSpace,
    TubeGeometry,
    Vector3,
} from 'three';
import { box, createStage, cylinder, smooth, span } from '@/lib/scene-engine';

// As contas da viagem, as mesmas do texto: Tesla Model 3 (491 km) com 80% de bateria
const TOTAL_KM = 491;
const TRIP_KM = 512;
const RESERVE_KM = TOTAL_KM * 0.2;
const SAFE_KM = TOTAL_KM * 0.8 - RESERVE_KM; // 294,6 km: até aqui o carro vai sem tocar na reserva
const SEARCH_KM = RESERVE_KM * 0.95; // o raio da busca na OpenChargeMap
const STATION_KM = 271; // a estação escolhida, dentro do raio e antes da reserva

const LAPTOP = new Vector3(0, 0, 0);
const BATTERY = new Vector3(6.5, 0, -6);
const MAP = new Vector3(22, 0, -1);
const MAP_W = 22;
const MAP_D = 13;
const ROAD_Y = 0.13;

// O caminho da origem ao destino, por cima do mapa
const ROUTE = new CatmullRomCurve3([
    [13.5, 1.8], [15.7, 0.5], [17.8, 1.3], [20, -0.3], [22.2, -1.4], [24.7, -0.6], [27.3, -2.9], [29.8, -2.4],
].map(([x, z]) => new Vector3(x, ROAD_Y, z)), false, 'centripetal');

const SAFE_T = SAFE_KM / TRIP_KM;
const STATION_T = STATION_KM / TRIP_KM;

// Um pedaço do caminho, para desenhar o trecho seguro e o resto em cores diferentes
class Part extends Curve {
    constructor(curve, from, to) {
        super();
        Object.assign(this, { curve, from, to });
    }

    getPoint(t, target = new Vector3()) {
        return this.curve.getPointAt(this.from + (this.to - this.from) * t, target);
    }
}

// Números pseudoaleatórios com semente: o mesmo mapa em todo carregamento
function random(seed) {
    return () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };
}

function cameraKeys(safePoint) {
    const at = (s, look, offset) => ({ s, look, pos: look.clone().add(new Vector3(...offset)), hold: true });
    return [
        at(0, LAPTOP.clone().add(new Vector3(0, 1.2, 0)), [-2.2, 2.0, 7.6]),
        at(1, BATTERY.clone().add(new Vector3(0, 1.3, 0)), [2.4, 2.0, 7.2]),
        at(2, MAP.clone().add(new Vector3(-1.5, 0, 0.8)), [-12, 15, 14]),
        at(3, MAP.clone().add(new Vector3(-1, 0, 0.3)), [-9, 15, 15]),
        at(4, safePoint.clone(), [-3, 7.5, 9]),
        at(5, MAP.clone().add(new Vector3(-1, 0, 0)), [-10, 20, 16]),
    ];
}

// Tela do e-Move no notebook, desenhada num canvas com a fonte da página
function drawScreen(ctx, tokens, labels) {
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
    ctx.fillText(labels.title, w - 64, 94);
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
    ctx.fillStyle = tokens.ink;
    ctx.font = `700 96px ${font}`;
    ctx.fillText(`392${labels.decimal}8 km`, 64, 520);

    ctx.fillStyle = tokens.accent;
    ctx.fillRect(w - 64 - 260, 452, 260, 76);
    ctx.fillStyle = '#0a0a0a';
    ctx.font = `600 30px ${font}`;
    ctx.textAlign = 'center';
    ctx.fillText(labels.action, w - 64 - 130, 502);
    ctx.textAlign = 'left';
}

// Pino de mapa: uma gota invertida
function pin(material) {
    const group = new Group();
    const tip = new Mesh(new ConeGeometry(0.26, 0.8, 32), material);
    tip.rotation.x = Math.PI;
    tip.position.y = 0.4;
    const head = new Mesh(new SphereGeometry(0.34, 32, 16), material);
    head.position.y = 0.95;
    tip.castShadow = head.castShadow = true;
    group.add(tip, head);
    return group;
}

function build({ scene, mats, tokens }, labels) {
    const own = []; // materiais da cena, liberados no dispose

    // 0 · Notebook com o e-Move aberto
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 1024;
    screenCanvas.height = 640;
    const screenTexture = new CanvasTexture(screenCanvas);
    screenTexture.colorSpace = SRGBColorSpace;
    screenTexture.anisotropy = 4;
    const screenMat = new MeshBasicMaterial({ map: screenTexture, toneMapped: false });
    own.push(screenMat);
    drawScreen(screenCanvas.getContext('2d'), tokens, labels);
    screenTexture.needsUpdate = true;

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
    laptop.position.copy(LAPTOP);
    laptop.rotation.y = 0.32;

    // 1 · A bateria do carro: enche até 80% quando a autonomia é calculada
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
    battery.position.copy(BATTERY);

    // O mapa: uma placa com ruas e quarteirões, mais densos perto da origem e do destino
    const plateMat = new MeshStandardMaterial({ roughness: 0.9, color: new Color(tokens.floor).lerp(new Color(tokens.body), 0.45) });
    own.push(plateMat);
    const map = new Group();
    const plate = box(MAP_W, 0.1, MAP_D, plateMat);
    plate.position.y = 0.05;
    map.add(plate);

    const samples = ROUTE.getSpacedPoints(160);
    const nearRoute = (x, z, gap) => samples.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < gap * gap);
    const left = MAP.x - MAP_W / 2 + 0.6;
    const back = MAP.z - MAP_D / 2 + 0.6;
    const rand = random(7);

    for (const z of [-5.1, -2.5, 0.7, 3.4, 5.0]) {
        const road = box(MAP_W - 1.2, 0.02, 0.09, mats.dim);
        road.position.set(MAP.x, 0.11, MAP.z + z);
        map.add(road);
    }
    for (const x of [-9.3, -6.8, -3.2, -0.5, 2.7, 5.4, 8.3, 9.9]) {
        const road = box(0.09, 0.02, MAP_D - 1.2, mats.dim);
        road.position.set(MAP.x + x, 0.11, MAP.z);
        map.add(road);
    }

    const ends = [ROUTE.getPointAt(0), ROUTE.getPointAt(1)];
    for (let n = 0; n < 220 && map.children.length < 120; n++) {
        const x = left + rand() * (MAP_W - 1.6);
        const z = back + rand() * (MAP_D - 1.6);
        if (nearRoute(x, z, 0.75)) continue;
        const town = Math.min(...ends.map((e) => Math.hypot(e.x - x, e.z - z)));
        if (town > 3.5 && rand() < 0.6) continue;
        const w = 0.35 + rand() * 0.6;
        const d = 0.35 + rand() * 0.6;
        const h = town < 3.5 ? 0.15 + rand() * 0.55 : 0.08 + rand() * 0.15;
        const block = box(w, h, d, mats.body);
        block.position.set(x, 0.1 + h / 2, z);
        map.add(block);
    }

    // A rota: o trecho que cabe no alcance seguro em azul, o resto em branco
    const TUBE = 160;
    const RADIAL = 8;
    const tube = (curve, material) => new Mesh(new TubeGeometry(curve, TUBE, 0.07, RADIAL, false), material);
    const safeTube = tube(new Part(ROUTE, 0, SAFE_T), mats.accent);
    const restTube = tube(new Part(ROUTE, SAFE_T, 1), mats.ink);
    const drawTube = (mesh, f) => mesh.geometry.setDrawRange(0, Math.floor(f * TUBE) * RADIAL * 6);

    const origin = pin(mats.ink);
    const destination = pin(mats.accent);
    origin.position.copy(ends[0]).add(new Vector3(-0.5, 0, -0.6));
    destination.position.copy(ends[1]).add(new Vector3(0.4, 0, -0.5));

    // Onde a reserva começa: um anel no chão
    const safePoint = ROUTE.getPointAt(SAFE_T);
    const marker = new Mesh(new RingGeometry(0.32, 0.44, 48), mats.routeLit);
    marker.rotation.x = -Math.PI / 2;
    marker.position.copy(safePoint).setY(0.16);

    // O raio da busca, em escala com o resto do mapa
    const radius = ROUTE.getLength() * (SEARCH_KM / TRIP_KM);
    const areaMat = new MeshBasicMaterial({ color: tokens.accent, transparent: true, opacity: 0.1, depthWrite: false, side: DoubleSide });
    const edgeMat = new MeshBasicMaterial({ color: tokens.accent, transparent: true, opacity: 0.7, depthWrite: false, side: DoubleSide });
    own.push(areaMat, edgeMat);
    const search = new Group();
    const area = new Mesh(new CircleGeometry(radius, 64), areaMat);
    const edge = new Mesh(new RingGeometry(radius - 0.06, radius, 96), edgeMat);
    area.rotation.x = edge.rotation.x = -Math.PI / 2;
    search.add(area, edge);
    search.position.copy(safePoint).setY(0.15);

    // As estações que a busca devolve; a primeira, ao lado da rota, é a escolhida
    const stationPoint = ROUTE.getPointAt(STATION_T);
    const ahead = ROUTE.getTangentAt(STATION_T);
    const side = new Vector3(-ahead.z, 0, ahead.x).normalize().multiplyScalar(0.55);
    const spots = [
        stationPoint.clone().add(side),
        safePoint.clone().add(new Vector3(1.7, 0, 1.3)),
        safePoint.clone().add(new Vector3(-1.1, 0, 2.0)),
        safePoint.clone().add(new Vector3(2.3, 0, -1.5)),
        safePoint.clone().add(new Vector3(-2.0, 0, -1.7)),
    ];
    const stations = spots.map((spot) => {
        const post = new Group();
        const body = box(0.32, 0.8, 0.24, mats.body);
        body.position.y = 0.4;
        const light = box(0.2, 0.12, 0.05, mats.led);
        light.position.set(0, 0.6, 0.13);
        post.add(body, light);
        post.position.copy(spot).setY(0.1);
        post.lookAt(spot.x, 0.1, spot.z + 1);
        return { post, light };
    });

    // O carro, com a carga da bateria numa barra por cima
    const car = new Group();
    const chassis = box(0.9, 0.24, 0.48, mats.ink);
    chassis.position.y = 0.2;
    const cabin = box(0.5, 0.2, 0.42, mats.dim);
    cabin.position.set(-0.05, 0.42, 0);
    car.add(chassis, cabin);
    const gauge = new Group();
    const gaugeBack = box(0.9, 0.08, 0.08, mats.dim);
    const gaugeFill = box(0.9, 0.1, 0.1, mats.accent);
    gauge.add(gaugeBack, gaugeFill);
    gauge.position.y = 1;

    scene.add(laptop, battery, map, safeTube, restTube, origin, destination, marker, search, car, gauge,
        ...stations.map((s) => s.post));

    const here = new Vector3();
    const heading = new Vector3();

    // Onde o carro está (fração da rota) e quanto resta na bateria (0 a 1)
    const PER_T = TRIP_KM / TOTAL_KM;
    const AT_STATION = 0.8 - STATION_T * PER_T;
    function drive(s) {
        const go1 = smooth(span(s, 4.08, 4.42));
        const charge = smooth(span(s, 4.44, 4.58));
        const go2 = smooth(span(s, 4.6, 4.95));
        const t = STATION_T * go1 + (1 - STATION_T) * go2;
        if (!charge) return { t, level: 0.8 - t * PER_T };
        if (!go2) return { t, level: AT_STATION + (0.9 - AT_STATION) * charge };
        return { t, level: 0.9 - (t - STATION_T) * PER_T };
    }

    function update(s) {
        // 1 · a bateria enche na chegada da câmera
        const lit = Math.round(8 * smooth(span(s, 0.62, 0.98)));
        cells.forEach((cell, i) => { cell.material = i < lit ? mats.accent : mats.dim; });

        // 2 · os pinos caem do alto, primeiro a origem
        const dropA = smooth(span(s, 1.35, 1.8));
        const dropB = smooth(span(s, 1.55, 2.0));
        origin.visible = dropA > 0;
        destination.visible = dropB > 0;
        origin.position.y = 0.1 + (1 - dropA) * 7;
        destination.position.y = 0.1 + (1 - dropB) * 7;

        // 3 · a rota se desenha e o ponto da reserva acende
        const drawn = smooth(span(s, 2.15, 2.85));
        drawTube(safeTube, span(drawn, 0, SAFE_T));
        drawTube(restTube, span(drawn, SAFE_T, 1));
        marker.visible = s > 2.55;
        marker.scale.setScalar(0.4 + 0.6 * smooth(span(s, 2.55, 2.8)));

        // 4 · o raio de busca se abre, as estações sobem e uma é escolhida
        const open = smooth(span(s, 3.12, 3.55));
        const fade = 1 - span(s, 4.4, 4.75);
        search.visible = open > 0 && fade > 0;
        search.scale.setScalar(Math.max(open, 0.001));
        areaMat.opacity = 0.1 * fade;
        edgeMat.opacity = 0.7 * fade;
        stations.forEach(({ post, light }, i) => {
            const rise = smooth(span(s, 3.35 + i * 0.07, 3.6 + i * 0.07));
            post.visible = rise > 0;
            post.scale.set(1, Math.max(rise, 0.001), 1);
            light.material = i === 0 && s > 3.8 ? mats.accent : mats.led;
        });

        // 5 · o carro sai, para na estação, recarrega e chega ao destino
        const { t, level } = drive(s);
        car.visible = gauge.visible = s > 1.7;
        ROUTE.getPointAt(t, here);
        ROUTE.getTangentAt(t, heading);
        car.position.copy(here).setY(0.1);
        car.rotation.y = Math.atan2(-heading.z, heading.x);
        gauge.position.set(here.x, 1, here.z);
        gaugeFill.scale.x = Math.max(level, 0.01);
        gaugeFill.position.x = -0.45 * (1 - Math.max(level, 0.01));
        gaugeFill.material = level < 0.2 ? mats.ink : mats.accent;
        return false;
    }

    return {
        beats: 5,
        keys: cameraKeys(safePoint),
        shadow: { center: new Vector3(17, 0, -2), size: 23 },
        update,
        dispose() {
            own.forEach((m) => m.dispose());
            screenTexture.dispose();
        },
    };
}

export function createWorld(canvas, { labels, onReady }) {
    return createStage(canvas, { build: (ctx) => build(ctx, labels), onReady });
}
