import SpotlightCard from '../../ui/SpotlightCard';
import TechBadge from '../../ui/TechBadge';
import CodeProfile from '../about/CodeProfile';

export default function AboutSection({dict, lang}) {
    const frontendTechs = ['JavaScript', 'Next.js', 'React', 'HTML', 'CSS', 'Tailwind'];
    const backendTechs = ['Java', 'PHP', 'C/C++', 'Node.js', 'Python', 'Swift'];
    const infraTechs = ['SQL', 'Git', 'Linux', 'Docker', 'AWS'];

    return (
        <section id="about" className="py-32 bg-background">
            <div className="mx-auto max-w-275 px-8">

                {/* Cabeçalho da Seção */}
                <div className="mb-12 flex items-center gap-4">
                    <h2 className="text-3xl font-extrabold text-text-primary">{dict.aboutTitle}</h2>
                    <div className="h-px flex-1 bg-linear-to-r from-border to-transparent"></div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Card 1: Perfil (Ocupa 2 colunas em telas médias/grandes) */}
                    <SpotlightCard className="md:col-span-2">
                        <CodeProfile dict={dict} lang={lang} />
                    </SpotlightCard>

                    {/* Card 2: Frontend */}
                    <SpotlightCard className="flex flex-col justify-between">
                        <div>
                            <h4 className="mb-4 text-xl font-bold text-text-primary">Frontend</h4>
                            <div className="flex flex-wrap gap-2">
                                {frontendTechs.map((tech) => (
                                    <TechBadge key={tech} name={tech} />
                                ))}
                            </div>
                        </div>
                    </SpotlightCard>

                    {/* Card 3: Ferramentas e Dados */}
                    <SpotlightCard className="flex flex-col justify-between">
                        <div>
                            <h4 className="mb-4 text-xl font-bold text-text-primary">{dict.tools}</h4>
                            <div className="flex flex-wrap gap-2">
                                {infraTechs.map((tech) => (
                                    <TechBadge key={tech} name={tech} />
                                ))}
                            </div>
                        </div>
                    </SpotlightCard>

                    {/* Card 4: Backend (Ocupa 2 colunas para fechar o grid bonito) */}
                    <SpotlightCard className="md:col-span-2">
                        <div className="flex flex-col h-full justify-center">
                            <h4 className="mb-4 text-xl font-bold text-text-primary">Backend</h4>
                            <div className="flex flex-wrap gap-2">
                                {backendTechs.map((tech) => (
                                    <TechBadge key={tech} name={tech} />
                                ))}
                            </div>
                        </div>
                    </SpotlightCard>

                </div>
            </div>
        </section>
    );
}