'use client';

import Link from 'next/link';
import LanguagePicker from '@/components/ui/LanguagePicker';

export default function Header({ dict, lang }) {

    const handleScroll = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-white/5 bg-[#0a0a0a]/70">
            <div className="max-w-275 mx-auto px-8">
                <nav className="h-17.5 flex justify-between items-center">
                    <Link href={`/${lang}`} className="logo text-xl font-extrabold tracking-tighter" onClick={(e) => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        Felipe<span className="text-blue-500">.dev</span>
                    </Link>

                    <ul className="nav-links hidden md:flex gap-8 items-center">
                        <li>
                            <a
                                href="#about"
                                onClick={(e) => handleScroll(e, 'about')}
                                className="cursor-pointer text-sm font-medium text-[#a1a1a1] hover:text-[#ededed] transition-colors"
                            >
                                {dict.about}
                            </a>
                        </li>
                        <li>
                            <a
                                href="#projects"
                                onClick={(e) => handleScroll(e, 'projects')}
                                className="cursor-pointer text-sm font-medium text-[#a1a1a1] hover:text-[#ededed] transition-colors"
                            >
                                {dict.projects}
                            </a>
                        </li>
                        <li>
                            <a href="mailto:fgiacominicocco@gmail.com" className="text-sm font-medium text-[#a1a1a1] hover:text-[#ededed] transition-colors">
                                {dict.contact}
                            </a>
                        </li>
                        <li className="ml-2">
                            <LanguagePicker lang={lang} />
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}