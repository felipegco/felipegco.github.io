'use client';

import { useEffect, useRef } from 'react';
import { useToday } from '@/lib/use-today';

// O nome atravessa a faixa azul de ponta a ponta, e embaixo dele uma linha fina
// com a navegação, o © e o "voltar ao topo". Na página inicial ele fecha o último
// slide junto com o Contato: a altura dele vira --footer-h para o Contato ocupar o resto da tela.
// base: vazio na página inicial; nas páginas de projeto, o caminho dela (/pt)
// top: a seção do topo desta página, para onde o "voltar ao topo" desliza
// builtAt: a data do build, vinda da página, para o ano do © (use-today.js)
export default function Footer({ dict, base = '', top = 'about', builtAt }) {
    const year = useToday(builtAt).getUTCFullYear();
    const ref = useRef(null);
    const nameRef = useRef(null);

    useEffect(() => {
        const footer = ref.current;
        const name = nameRef.current;
        if (!footer || !name) return;
        const root = document.documentElement;

        // O tamanho da fonte que faz o nome caber exatamente na largura disponível
        const fit = () => {
            const line = name.parentElement;
            const css = getComputedStyle(line);
            const room = line.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
            line.style.fontSize = '100px';
            const width = name.offsetWidth;
            if (width) line.style.fontSize = `${Math.floor((100 * room) / width * 10) / 10}px`;
            root.style.setProperty('--footer-h', `${footer.offsetHeight}px`);
        };

        const observer = new ResizeObserver(fit);
        observer.observe(footer);
        document.fonts.ready.then(fit);
        fit();
        return () => {
            observer.disconnect();
            root.style.removeProperty('--footer-h');
        };
    }, []);

    return (
        <footer className="footer" ref={ref}>
            <p className="footer-name" data-reveal aria-hidden="true">
                <span ref={nameRef}>Felipe Giacomini</span>
            </p>
            <div className="footer-bar">
                <ul>
                    <li><a href={`${base}#about`}>{dict.about}</a></li>
                    <li><a href={`${base}#projects`}>{dict.projects}</a></li>
                    <li><a href={`${base}#journey`}>{dict.journey}</a></li>
                    <li><a href={`${base}#contact`}>{dict.contact}</a></li>
                </ul>
                <small>
                    &copy; {year} {dict.rights} ·{' '}
                    <a href="https://github.com/felipegco/felipegco.github.io" target="_blank" rel="noopener noreferrer">{dict.code}</a>
                </small>
                <a href={`#${top}`} className="footer-up">↑ {dict.top}</a>
            </div>
        </footer>
    );
}
