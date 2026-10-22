import Scene3D from '@/components/scene-3d';

// Trechos reais dos repositórios do e-Move (back-end e front-end), na ordem do planejamento
const CODE = {
    range: {
        file: 'VeiculoService.java',
        lines: [
            'if (nivelBateria < 0 || nivelBateria > 100) {',
            '    throw new IllegalArgumentException(…);',
            '}',
            'double autonomiaEstimada =',
            '    veiculo.getAutonomia() * (nivelBateria / 100.0);',
        ],
    },
    geocoding: {
        file: 'GeocodingService.java',
        lines: [
            'UriComponentsBuilder.fromHttpUrl(apiUrl)',
            '    .queryParam("q", address)',
            '    .queryParam("limit", "5")',
            '…',
            'dto.setLatitude(node.get("lat").asDouble());',
            'dto.setLongitude(node.get("lon").asDouble());',
        ],
    },
    route: {
        file: 'AbaMapa.jsx',
        lines: [
            'const kmReserva = autonomiaTotalKm * 0.20;',
            'const alcanceSeguro = autonomiaAtualKm - kmReserva;',
            'if (distanciaRotaKm <= alcanceSeguro) {',
            '    rotaFinal.push(routeData);',
            '} else {',
            '    turf.along(linha, alcanceSeguro, …);',
        ],
    },
    stations: {
        file: 'OpenChargeMapService.java',
        lines: [
            '.path("/poi/")',
            '.queryParam("latitude", lat)',
            '.queryParam("longitude", lon)',
            '.queryParam("distance", distanciaKm)',
            '.queryParam("maxresults", 10)',
        ],
    },
    trip: {
        file: 'ViagemService.java',
        lines: [
            '@Transactional',
            'public class ViagemService { … }',
            '',
            'novaViagem.setKmTotal(dto.getKmTotal());',
            'novaViagem.setCo2Preservado(…);',
            'return viagemRepository.save(novaViagem);',
        ],
    },
};

const TOKEN = /("[^"]*")|(@\w+)|\b(\d+(?:\.\d+)?)\b|\b(public|class|if|else|const|return|throw|new|double)\b/g;

function highlight(line) {
    const parts = [];
    let last = 0;
    for (const m of line.matchAll(TOKEN)) {
        if (m.index > last) parts.push(line.slice(last, m.index));
        const cls = m[1] ? 's' : m[3] ? 'n' : 'k';
        parts.push(<span key={m.index} className={cls}>{m[0]}</span>);
        last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return parts;
}

function Code({ id }) {
    const { file, lines } = CODE[id];
    return (
        <pre className="code-block"><code>
            <span className="code-title">{file}</span>
            {lines.map((line, i) => <span key={i}>{highlight(line)}{'\n'}</span>)}
        </code></pre>
    );
}

// Como o e-Move planeja uma viagem de carro elétrico, etapa por etapa.
// Abre a página do projeto: o título dela é o nome do e-Move.
export default function RequestScene({ dict, header }) {
    const { request, work } = dict;
    const emove = work.projects.find((p) => p.id === 'emove');
    const steps = request.stops;

    return (
        <Scene3D
            id="emove"
            world="request"
            labels={request.screen}
            label={request.label}
            hold={4}
            holdStacked={3.5}
            route={steps}
            routeLabel={request.route}
            header={header}
            backdrop={<img src="/images/work/emove.jpg" alt="" width="1600" height="1000" />}
            className="request"
        >
            <article className="scene3d-beat" id={`stop-${steps[0].id}`}>
                <div className="scene3d-copy">
                    <h1 className="project-title">{emove.name}</h1>
                    <p className="project-meta">{emove.meta}, {emove.year}</p>
                    <p>{emove.desc}</p>
                    <p className="project-stack">{emove.stack}</p>
                    <p className="project-links">
                        <a href={emove.code} target="_blank" rel="noopener noreferrer">{work.code}</a>
                        <a href={emove.demo} target="_blank" rel="noopener noreferrer">{work.demo}</a>
                    </p>
                    <p className="scene3d-hint">{request.hint}</p>
                </div>
            </article>

            {steps.slice(1).map((step) => (
                <article key={step.id} className="scene3d-beat" id={`stop-${step.id}`}>
                    <div className="scene3d-copy">
                        <h2 className="lead">{step.title}</h2>
                        <p>{step.text}</p>
                        {step.link && <a href="#console" className="button">{step.link}</a>}
                    </div>
                    <Code id={step.id} />
                </article>
            ))}
        </Scene3D>
    );
}
