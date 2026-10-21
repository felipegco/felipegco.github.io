// A ferramenta de cada fase da introdução, embaixo do card: as linhas se digitam
// quando o card aparece (globals.css) e a última traz o resultado.
// Protótipo: os trechos ilustram a época, ainda não vêm de um repositório real.
const WINDOWS = {
    hardware: {
        file: 'gestao_interna.sql',
        lines: [
            'SELECT os.id, cliente, equipamento, status',
            '  FROM ordens_servico os',
            " WHERE status = 'em_bancada';",
        ],
    },
    servers: {
        file: 'novo-usuario.ps1',
        lines: [
            'New-ADUser -Name $nome -Path "OU=Usuarios,DC=..."',
            'Add-ADGroupMember -Identity "Financeiro" ...',
        ],
    },
};

const TOKEN = /('[^']*'|"[^"]*")|(\$\w+)|\b(SELECT|FROM|WHERE|New-ADUser|Add-ADGroupMember)\b/g;

function highlight(line) {
    const parts = [];
    let last = 0;
    for (const m of line.matchAll(TOKEN)) {
        if (m.index > last) parts.push(line.slice(last, m.index));
        const cls = m[1] ? 's' : m[2] ? 'n' : 'k';
        parts.push(<span key={m.index} className={cls}>{m[0]}</span>);
        last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return parts;
}

// Ritmo da digitação: começa depois que o card entra e segue linha por linha
const START = 450;
const PER_CHAR = 16;
const PAUSE = 120;

export default function IntroWindow({ id, out }) {
    const { file, lines } = WINDOWS[id];
    let at = START;
    const timed = lines.map((line) => {
        const delay = at;
        at += line.length * PER_CHAR + PAUSE;
        return { line, delay };
    });

    return (
        <pre className="code-block term"><code>
            <span className="code-title">{file}</span>
            {timed.map(({ line, delay }) => (
                <span key={line} className="term-line" style={{ '--n': line.length, '--d': `${delay}ms` }}>
                    {highlight(line)}
                </span>
            ))}
            <span className="term-line term-out" style={{ '--d': `${at + 200}ms` }}>{out}</span>
        </code></pre>
    );
}
