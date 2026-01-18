'use client';

export default function Hero({dict}) {

    const handleScroll = (e) => {
        e.preventDefault();
        const element = document.getElementById('projects');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="relative flex items-center bg-background text-text-primary mt-36 pb-32">

            <div
                className="absolute right-[10%] top-[20%] h-75 w-75 rounded-full bg-blue-500 blur-[150px] transition-opacity duration-300 pointer-events-none"
                style={{ opacity: 'var(--glow-hero, 0.15)' }}
            ></div>

            {/* Container Principal */}
            <div className="mx-auto w-full max-w-275 px-8 relative z-10">

                {/* Hero Content */}
                <div className="max-w-175">

                    {/* Badge */}
                    <span className="mb-6 inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 font-mono text-sm font-semibold text-blue-500">
                        {dict.badge}
                    </span>

                    {/* Título com Gradiente */}
                    <h1 className="mb-6 text-[4rem] font-extrabold leading-[1.1] tracking-tighter sm:text-5xl md:text-7xl">
                        {dict.title_part1} <span className="bg-linear-to-r from-text-primary to-blue-500 bg-clip-text text-transparent">{dict.title_highlight}</span>.
                    </h1>

                    {/* Parágrafo */}
                    <p className="mb-10 max-w-125 text-lg text-text-secondary">
                        {dict.description}
                    </p>

                    {/* Grupo de Botões */}
                    <div className="flex gap-4">
                        <a
                            href="#projects"
                            onClick={handleScroll}
                            className="cursor-pointer rounded-lg border border-text-primary bg-text-primary px-6 py-3 font-semibold text-background transition-all duration-300 hover:bg-transparent hover:text-text-primary"
                        >
                            {dict.cta_projects}
                        </a>

                        <a
                            href="https://github.com/FeCocco"
                            target="_blank"
                            className="flex items-center gap-2 rounded-lg border border-border bg-transparent px-6 py-3 font-semibold text-text-primary transition-all duration-300 hover:border-text-primary hover:bg-card-hover"
                        >
                            <i className="fa-brands fa-github"></i> GitHub
                        </a>
                    </div>
                </div>
            </div>
        </section>
    )
}