import TechBadge from "@/components/ui/TechBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { ExternalLink } from "lucide-react";

export default function ProjetoCard({ icon: Icon, title, description, techs, data, githubUrl, deployUrl, status, dict }) {
    return (
        <div
            className="flex flex-col rounded-2xl border overflow-hidden transition-all group h-full hover:border-blue-500/30"
            style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)'
            }}
        >

            {/* Conteúdo Principal */}
            <div className="p-8 flex-1 flex flex-col">
                <div className="mb-4 flex justify-between items-start">

                    {/* Ícone do Projeto */}
                    <div className="text-blue-500 bg-blue-500/10 p-3 rounded-lg w-fit">
                        {Icon && <Icon size={24} strokeWidth={2.5} />}
                    </div>

                    <StatusBadge status={status} dict={dict}/>
                </div>

                <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>

                <p className="text-text-secondary text-sm leading-relaxed mb-6">
                    {description}
                </p>

                <div className="mt-auto flex flex-wrap gap-2">
                    {techs.map((tech, index) => (
                        <TechBadge key={index} name={tech} />
                    ))}
                </div>
            </div>

            {/* Rodapé */}
            <div
                className="px-8 py-4 border-t flex justify-between items-center"
                style={{
                    backgroundColor: 'var(--card-bg-secondary)',
                    borderColor: 'var(--card-border)'
                }}
            >
                <span className="text-xs font-mono text-text-tertiary">{data}</span>
                <div className="flex gap-4">

                    {githubUrl && (
                        <a
                            href={githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-secondary hover:text-blue-500 transition-colors"
                            aria-label="Ver código no GitHub"
                        >
                            <i className="fa-brands fa-github text-xl"></i>
                        </a>
                    )}

                    {deployUrl && (
                        <a
                            href={deployUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-secondary hover:text-blue-500 transition-colors"
                            aria-label="Ver projeto online"
                        >
                            <ExternalLink size={20} strokeWidth={2} />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}