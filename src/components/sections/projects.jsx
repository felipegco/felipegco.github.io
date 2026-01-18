import ProjetoCard from "@/components/ui/projetoCard";
import {TruckElectric, CalendarCheck, Terminal, LayoutTemplate} from "lucide-react";

export default function Projects({dict}) {

    const projectCategories = [
        {
            id: "backend",
            title: "Backend & APIs",
            description: dict.backend.title,
            projects: [
                {
                    icon: TruckElectric,
                    title: "e-Move",
                    description: dict.backend.e_move_backend.description,
                    techs: ["Spring Boot", "Java", "Maven", "Spring Data JPA", "Hibernate", "MariaDB/MySQL", "Spring Security", "JWT", "Password Encoding", "Lombok", "Bean Validation"],
                    data: "2025",
                    githubUrl: "https://github.com/FeCocco/e-move-frontend.git",
                    status: dict.badges.updating
                },
                {
                    icon: CalendarCheck,
                    title: "Clinicare",
                    description: dict.backend.clinicare_backend.description,
                    techs: ["Java", "Spring Boot", "Spring Web", "Spring Data JPA", "MariaDB", "Swagger", "Lombok", "JWT"],
                    data: "2025",
                    githubUrl: "https://github.com/FeCocco/sistema-agendamentos",
                    deployUrl: null,
                    status: dict.badges.developing
                }
            ]
        },
        {
            id: "frontend",
            title: "Frontend",
            description: dict.frontend.title,
            projects: [
                {
                    icon: TruckElectric,
                    title: "e-Move",
                    description: dict.backend.e_move_backend.description,
                    techs: ["Next.js", "JavaScript", "Zod", "Tailwind CSS", "shadcn/ui", "Framer Motion", "Chart.js", "Recharts"],
                    data: "2025",
                    githubUrl: "https://github.com/FeCocco/e-move-frontend.git",
                    status: dict.badges.concluded
                },
                {
                    icon: LayoutTemplate,
                    title: "Clinicare Website",
                    description: dict.frontend.clinicare_frontend,
                    techs: ["React", "Vite", "JavaScript", "CSS3"],
                    data: "2025",
                    githubUrl: "https://github.com/FeCocco/portfolio-v2",
                    deployUrl: "https://fecocco.github.io/clinicare-frontend/",
                    status: dict.badges.developing
                }
            ]
        },

        {
            id: "scripts",
            title: "Scripts & Automação",
            description: dict.scripts.title,
            projects: [
                {
                    icon: Terminal,
                    title: "Port Scanner",
                    description: dict.scripts.port_scanner,
                    techs: ["Python"],
                    data: "2025",
                    githubUrl: "https://github.com/FeCocco/port-scanner.git",
                    status: dict.badges.concluded
                }
            ]
        }
    ];

    return (
        <section id="projects" className="py-20 w-full max-w-275 mx-auto px-8">

            <div className="mb-12">
                <div className="flex items-center gap-4 mb-4">
                    <h2 className="text-3xl font-extrabold text-[#ededed]">{dict.title}</h2>
                    <div className="h-px flex-1 bg-linear-to-r from-neutral-800 to-transparent"></div>
                </div>
            </div>

            <div className="flex flex-col gap-24">
                {projectCategories.map((category) => (
                    <div key={category.id} className="flex flex-col">

                        <div className="mb-8 border-l-2 border-blue-500 pl-4">
                            <h3 className="text-xl font-bold text-white mb-1">{category.title}</h3>
                            <p className="text-sm text-[#a1a1a1]">{category.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                            {category.projects.map((project, index) => (
                                <ProjetoCard
                                    key={index}
                                    icon={project.icon}
                                    title={project.title}
                                    description={project.description}
                                    techs={project.techs}
                                    data={project.data}
                                    githubUrl={project.githubUrl}
                                    deployUrl={project.deployUrl}
                                    status={project.status}
                                    dict={dict}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}