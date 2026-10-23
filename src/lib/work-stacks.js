// A pilha de cada projeto na seção de projetos (stack-world.js): as camadas de baixo
// (os dados) para cima (o que o usuário vê), qual delas é o coração do projeto (core,
// em azul) e a peça-assinatura do topo. Projeto sem entrada aqui empilha a linha de
// stack do dicionário, sem peça.
export const STACKS = {
    emove: { layers: ['MariaDB', 'JPA', 'Java 17 · Spring Boot 3', 'Spring Security', 'Next.js'], core: 2, topper: 'pin' },
    greentech: { layers: ['PostgreSQL 16', 'Django REST Framework', 'JWT', 'Docker Compose'], core: 1, topper: 'greenhouse' },
    triagem: { layers: ['Redis', 'Ollama · Llama 3.1', 'Groq API', 'n8n'], core: 3, topper: 'chat' },
    clinicare: { layers: ['MariaDB', 'JPA', 'Java 17 · Spring Boot 3', 'Swagger', 'React'], core: 2, topper: 'calendar' },
    notch: { layers: ['macOS', 'Swift', 'SwiftUI'], core: 2, topper: 'notch' },
    atoll: { layers: ['macOS', 'Swift', 'SwiftUI'], core: 2, topper: 'atoll' },
};

export function stackOf(project) {
    return STACKS[project.id] ?? { layers: project.stack.split(', ').slice(0, 5).reverse(), core: -1 };
}
