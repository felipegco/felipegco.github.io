import Header from "@/components/sections/header";
import Projects from "@/components/sections/projects";
import Hero from "@/components/sections/hero";
import AboutSection from "@/components/sections/about/AboutSection";
import Footer from "@/components/sections/footer";
import { getDictionary } from "@/lib/get-dictionary";
import ExperienceSection from "@/components/sections/experience";
import Education from "@/components/sections/education";

export default async function Home({ params }) {
    const { lang } = await params;
    const dict = await getDictionary(lang);

    return (
        <div className="min-h-screen bg-background text-text-primary font-sans transition-colors duration-300">
            <Header dict={dict.header} lang={lang} />
            <main className="flex flex-col w-full">
                <Hero dict={dict.hero} />
                <AboutSection dict={dict.about} />
                <ExperienceSection dict={dict.experience} />
                <Education dict={dict.education} />
                <Projects dict={dict.projects} />
            </main>
            <Footer dict={dict.footer} />
        </div>
    );
}