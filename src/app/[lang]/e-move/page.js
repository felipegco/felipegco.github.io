import RequestScene from "@/components/sections/request-scene";
import EmoveConsole from "@/components/sections/emove-console";
import Footer from "@/components/sections/footer";
import Topbar from "@/components/ui/Topbar";
import RevealObserver from "@/components/RevealObserver";
import { getDictionary } from "@/lib/get-dictionary";

export async function generateMetadata({ params }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    const emove = dict.work.projects.find((p) => p.id === "emove");
    return {
        title: `e-Move · ${dict.meta.title}`,
        description: emove.desc,
    };
}

// Página do e-Move: a viagem de uma requisição em 3D e, depois, o console para testar a API
export default async function EmovePage({ params }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);

    return (
        <>
            <main className="project-page">
                <RequestScene dict={dict} header={<Topbar nav={dict.nav} lang={lang} />} />
                <EmoveConsole dict={dict.console} />
                <nav className="project-back" data-slide aria-label={dict.project.backLabel}>
                    <a href={`/${lang}#projects`}>{dict.project.back}</a>
                </nav>
            </main>
            <Footer dict={dict.footer} base={`/${lang}`} top="emove" />
            <RevealObserver />
        </>
    );
}
