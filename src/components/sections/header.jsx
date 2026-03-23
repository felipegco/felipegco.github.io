'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { X, Menu } from 'lucide-react';
import LanguagePicker from '@/components/ui/LanguagePicker';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Header({ dict, lang }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    const handleScroll = (e, id) => {
        e.preventDefault();
        setMenuOpen(false);
        setTimeout(() => {
            const element = document.getElementById(id);
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 320);
    };

    const navLinks = [
        { label: dict.about,      id: 'about' },
        { label: dict.experience, id: 'experience' },
        { label: dict.education,  id: 'education' },
        { label: dict.projects,   id: 'projects' },
    ];

    return (
        <>
            {/* ── Injeção de estilos da animação dos links ── */}
            <style>{`
                @keyframes slideInLink {
                    from { opacity: 0; transform: translateX(12px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                .drawer-link {
                    opacity: 0;
                }
                .drawer-open .drawer-link {
                    animation: slideInLink 0.22s ease forwards;
                }
            `}</style>

            <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-border bg-background/70">
                <div className="max-w-275 mx-auto px-8">
                    <nav className="h-17.5 flex justify-between items-center">

                        {/* Logo */}
                        <Link
                            href={`/${lang}`}
                            className="logo text-xl font-extrabold tracking-tighter text-text-primary"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            Felipe<span className="text-blue-500">.dev</span>
                        </Link>

                        {/* Nav desktop */}
                        <ul className="nav-links hidden md:flex gap-6 items-center">
                            {navLinks.map((link) => (
                                <li key={link.id}>
                                    <a
                                        href={`#${link.id}`}
                                        onClick={(e) => handleScroll(e, link.id)}
                                        className="cursor-pointer text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                            <li>
                                <a
                                    href="mailto:fgiacominicocco@gmail.com"
                                    className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    {dict.contact}
                                </a>
                            </li>
                            <li><ThemeToggle /></li>
                            <li><LanguagePicker lang={lang} /></li>
                        </ul>

                        {/* Controles mobile */}
                        <div className="flex md:hidden items-center gap-3">
                            <ThemeToggle />
                            <LanguagePicker lang={lang} />
                            <button
                                onClick={() => setMenuOpen(true)}
                                className="flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 text-text-secondary hover:text-text-primary"
                                style={{
                                    borderColor: 'var(--card-border)',
                                    backgroundColor: 'var(--card-bg)',
                                }}
                                aria-label="Abrir menu"
                            >
                                <Menu size={18} />
                            </button>
                        </div>

                    </nav>
                </div>
            </header>

            {/* ── OVERLAY ── */}
            {mounted && (
                <div
                    className="fixed inset-0 z-40 md:hidden"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(4px)',
                        opacity: menuOpen ? 1 : 0,
                        pointerEvents: menuOpen ? 'auto' : 'none',
                        transition: 'opacity 0.3s ease',
                    }}
                    onClick={() => setMenuOpen(false)}
                />
            )}

            {/* ── DRAWER ── */}
            {mounted && (
                <div
                    className={`fixed top-0 right-0 h-full w-72 z-50 flex flex-col md:hidden ${menuOpen ? 'drawer-open' : ''}`}
                    style={{
                        backgroundColor: 'var(--card-bg)',
                        borderLeft: '1px solid var(--card-border)',
                        transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: menuOpen ? '-8px 0 32px rgba(0,0,0,0.25)' : 'none',
                    }}
                >
                    {/* Cabeçalho do drawer */}
                    <div
                        className="flex items-center justify-between px-6 h-17.5 shrink-0 border-b"
                        style={{ borderColor: 'var(--card-border)' }}
                    >

                        <button
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-200 text-text-secondary hover:text-text-primary"
                            style={{
                                borderColor: 'var(--card-border)',
                                backgroundColor: 'var(--card-bg-secondary)',
                            }}
                            aria-label="Fechar menu"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Links */}
                    <nav className="flex flex-col px-4 py-6 gap-1 flex-1">
                        {navLinks.map((link, i) => (
                            <a
                                key={link.id}
                                href={`#${link.id}`}
                                onClick={(e) => handleScroll(e, link.id)}
                                className="drawer-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer text-text-secondary hover:text-text-primary hover:bg-card-secondary transition-colors duration-150"
                                style={{ animationDelay: `${i * 45}ms` }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 opacity-60" />
                                {link.label}
                            </a>
                        ))}

                        <div className="my-2 h-px" style={{ backgroundColor: 'var(--card-border)' }} />

                        <a
                            href="mailto:fgiacominicocco@gmail.com"
                            className="drawer-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-card-secondary transition-colors duration-150"
                            style={{ animationDelay: `${navLinks.length * 45}ms` }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 opacity-60" />
                            {dict.contact}
                        </a>
                    </nav>

                    {/* Rodapé com redes sociais */}
                    <div
                        className="px-6 py-6 border-t flex items-center gap-4"
                        style={{ borderColor: 'var(--card-border)' }}
                    >
                        <a
                            href="https://github.com/FeCocco"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-200 text-text-secondary hover:text-blue-500"
                            style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg-secondary)' }}
                        >
                            <i className="fa-brands fa-github text-sm" />
                        </a>
                        <a
                            href="https://www.linkedin.com/in/felipegcocco/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-200 text-text-secondary hover:text-blue-500"
                            style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg-secondary)' }}
                        >
                            <i className="fa-brands fa-linkedin text-sm" />
                        </a>
                        <a
                            href="mailto:fgiacominicocco@gmail.com"
                            className="flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-200 text-text-secondary hover:text-blue-500"
                            style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg-secondary)' }}
                        >
                            <i className="fa-solid fa-envelope text-sm" />
                        </a>
                    </div>
                </div>
            )}
        </>
    );
}