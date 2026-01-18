import Header from "@/components/sections/header";
import Projects from "@/components/sections/projects";
import Hero from "@/components/sections/hero";
import AboutSection from "@/components/sections/about/AboutSection";
import Footer from "@/components/sections/footer";
import { getDictionary } from "@/lib/get-dictionary";

export default async function Home({ params }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);

    return (
        <div className="min-h-screen bg-background text-text-primary font-sans transition-colors duration-300">
            <Header dict={dict.header} lang={lang} />
            <main className="flex flex-col w-full">
                <Hero dict={dict.hero} />
                <AboutSection dict={dict.about} />
                <Projects dict={dict.projects} />
            </main>
            <Footer dict={dict.footer} />
        </div>
    );
}