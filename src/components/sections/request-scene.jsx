import Scene3D from '@/components/scene-3d';

// Trechos reais do repositório felipegco/e-move-backend, na ordem da viagem
const CODE = {
    container: {
        file: 'Dockerfile',
        lines: [
            'FROM amazoncorretto:17-alpine',
            'RUN addgroup -S app && adduser -S app -G app',
            'USER app',
            'EXPOSE 8080',
        ],
    },
    controller: {
        file: 'VeiculoController.java',
        lines: [
            '@PutMapping("/{veiculoId}/bateria")',
            'public ResponseEntity<?> atualizarNivelBateria(…) {',
            '    String token = tokenService.resolveToken(request);',
            '    if (token == null)',
            '        return ResponseEntity.status(401).body(…);',
        ],
    },
    service: {
        file: 'VeiculoService.java',
        lines: [
            'if (nivelBateria < 0 || nivelBateria > 100) {',
            '    throw new IllegalArgumentException(…);',
            '}',
            'double autonomiaEstimada =',
            '    veiculo.getAutonomia() * (nivelBateria / 100.0);',
        ],
    },
    database: {
        file: 'VeiculoService.java',
        lines: [
            '@Service',
            '@Transactional',
            'public class VeiculoService { … }',
            '',
            'associacao.setNivelBateria(nivelBateria);',
            'usuarioVeiculoRepository.save(associacao);',
        ],
    },
    response: {
        file: 'HTTP/1.1 200 OK',
        lines: [
            '{',
            '  "id": 1, "marca": "Tesla", "modelo": "Model 3",',
            '  "nivelBateria": 80, "autonomiaTotal": 491,',
            '  "autonomiaEstimada": 392.8',
            '}',
        ],
    },
};

const TOKEN = /("[^"]*")|(@\w+)|\b(\d+(?:\.\d+)?)\b|\b(FROM|RUN|USER|EXPOSE|public|class|if|return|throw|new|double|String|null)\b/g;

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

// A viagem de uma requisição real do e-Move pelo back-end, parada por parada
export default function RequestScene({ dict }) {
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
            className="request"
        >
            <article className="scene3d-beat" id={`stop-${steps[0].id}`}>
                <div className="scene3d-copy">
                    <h2 className="project-title">{emove.name}</h2>
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
