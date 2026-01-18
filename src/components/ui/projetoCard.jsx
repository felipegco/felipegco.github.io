import TechBadge from "@/components/ui/TechBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { ExternalLink } from "lucide-react";

export default function ProjetoCard({ icon: Icon, title, description, techs, data, githubUrl, deployUrl, status, dict }) {
    return (
        <div className="flex flex-col bg-[#171717] rounded-2xl border border-[#262626] overflow-hidden hover:border-blue-500/30 transition-all group h-full">

            {/* Conteúdo Principal */}
            <div className="p-8 flex-1 flex flex-col">
                <div className="mb-4 flex justify-between items-start">

                    {/* Ícone do Projeto */}
                    <div className="text-blue-500 bg-blue-500/10 p-3 rounded-lg w-fit">
                        {Icon && <Icon size={24} strokeWidth={2.5} />}
                    </div>

                    <StatusBadge status={status} dict={dict}/>
                </div>

                <h3 className="text-xl font-bold text-[#ededed] mb-2">{title}</h3>

                <p className="text-[#a1a1a1] text-sm leading-relaxed mb-6">
                    {description}
                </p>

                <div className="mt-auto flex flex-wrap gap-2">
                    {techs.map((tech, index) => (
                        <TechBadge key={index} name={tech} />
                    ))}
                </div>
            </div>

            {/* Rodapé */}
            <div className="px-8 py-4 bg-[#1a1a1a]/50 border-t border-[#262626] flex justify-between items-center">
                <span className="text-xs font-mono text-[#525252]">{data}</span>
                <div className="flex gap-4">

                    {githubUrl && (
                        <a
                            href={githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#a1a1a1] hover:text-blue-500 transition-colors"
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
                            className="text-[#a1a1a1] hover:text-blue-500 transition-colors"
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