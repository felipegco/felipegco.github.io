'use client';

export default function Hero({dict, lang}) {

    const handleScroll = (e) => {
        e.preventDefault();
        const element = document.getElementById('projects');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="relative flex items-center overflow-hidden bg-[#0a0a0a] text-[#ededed] mt-36">

            <div className="absolute right-[10%] top-[20%] h-75 w-75 rounded-full bg-blue-500 opacity-15 blur-[150px]"></div>

            {/* Container Principal */}
            <div className="mx-auto w-full max-w-275 px-8">

                {/* Hero Content */}
                <div className="max-w-175">

                    {/* Badge */}
                    <span className="mb-6 inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 font-mono text-sm font-semibold text-blue-500">
                        {dict.badge}
                    </span>

                    {/* Título com Gradiente */}
                    <h1 className="mb-6 text-[4rem] font-extrabold leading-[1.1] tracking-tighter sm:text-5xl md:text-7xl">
                        {dict.title_part1} <span className="bg-linear-to-r from-white to-blue-500 bg-clip-text text-transparent">{dict.title_highlight}</span>.
                    </h1>

                    {/* Parágrafo */}
                    <p className="mb-10 max-w-125 text-lg text-neutral-400">
                        {dict.description}
                    </p>

                    {/* Grupo de Botões */}
                    <div className="flex gap-4">
                        <a
                            href="#projects"
                            onClick={handleScroll}
                            className="cursor-pointer rounded-lg border border-white bg-white px-6 py-3 font-semibold text-black transition-all duration-300 hover:bg-transparent hover:text-white"
                        >
                            {dict.cta_projects}
                        </a>

                        <a
                            href="https://github.com/FeCocco"
                            target="_blank"
                            className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-transparent px-6 py-3 font-semibold text-white transition-all duration-300 hover:border-white"
                        >
                            <i className="fa-brands fa-github"></i> GitHub
                        </a>
                    </div>
                </div>
            </div>
        </section>
    )
}