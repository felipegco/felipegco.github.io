import RequestScene from "@/components/sections/request-scene";
import About from "@/components/sections/about";
import Work from "@/components/sections/work";
import EmoveConsole from "@/components/sections/emove-console";
import Journey from "@/components/sections/journey";
import Contact from "@/components/sections/contact";
import Footer from "@/components/sections/footer";
import RevealObserver from "@/components/RevealObserver";
import { getDictionary } from "@/lib/get-dictionary";

export default async function Home({ params }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);

    return (
        <>
            <main>
                <RequestScene dict={dict} lang={lang} />
                <About dict={dict.about} />
                <Work dict={dict.work} />
                <EmoveConsole dict={dict.console} />
                <Journey dict={dict.journey} />
                <Contact dict={dict.contact} />
            </main>
            <Footer dict={dict.footer} />
            <RevealObserver />
        </>
    );
}
