import IntroScene from "@/components/sections/intro-scene";
import Work from "@/components/sections/work";
import Journey from "@/components/sections/journey";
import Contact from "@/components/sections/contact";
import Footer from "@/components/sections/footer";
import RevealObserver from "@/components/RevealObserver";
import { getDictionary } from "@/lib/get-dictionary";

export default async function Home({ params }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);
    // As datas da página (tempo em TI, semestre, ano do ©) partem do build; ver use-today.js
    const builtAt = new Date().toISOString();

    return (
        <>
            <main>
                <IntroScene dict={dict} lang={lang} />
                <Work dict={dict.work} lang={lang} />
                <Journey dict={dict.journey} builtAt={builtAt} />
                <Contact dict={dict.contact} />
            </main>
            <Footer dict={dict.footer} builtAt={builtAt} />
            <RevealObserver />
        </>
    );
}
