'use client';

import Image from 'next/image';

export default function Hero({ dict }) {

    const handleScroll = (e) => {
        e.preventDefault();
        const element = document.getElementById('projects');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="relative min-h-screen flex items-center overflow-hidden bg-background transition-colors duration-300 pt-20 md:pt-0">

            <div className="hidden md:flex absolute right-0 md:right-[5%] top-1/2 left-[65%] -translate-y-1/2 z-10 w-full md:w-[45%] lg:w-[40%] max-w-125 h-[40vh] md:h-[55vh] items-center justify-center pointer-events-none select-none">

                {/* LUZ AZUL */}
                <div className="absolute right-[15%] top-[20%] md:w-112.5 md:h-112.5 bg-blue-600/50 rounded-full blur-[100px] -z-10 animate-pulse-slow"></div>

                <div className="relative w-full h-full mask-[linear-gradient(to_bottom,black_60%,transparent_85%)]">
                    <Image
                        src="/images/profile.png"
                        alt="Profile"
                        fill
                        className="object-contain object-bottom md:object-cover md:object-center"
                        priority
                        draggable={false}
                    />
                </div>
            </div>

            {/* ================= CONTEÚDO DE TEXTO ================= */}
            <div className="mx-auto w-full max-w-275 px-8 relative z-20">
                <div className="max-w-175">
                    <span className="mb-6 inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 font-mono text-sm font-semibold text-blue-500">
                        {dict.badge}
                    </span>

                    <h1 className="mb-6 text-[4rem] font-extrabold leading-[1.1] tracking-tighter sm:text-5xl md:text-7xl">
                        {dict.title_part1} <span className="bg-linear-to-r from-text-primary to-blue-500 bg-clip-text text-transparent">{dict.title_highlight}</span>.
                    </h1>

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