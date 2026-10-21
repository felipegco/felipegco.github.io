'use client';

import { useEffect } from 'react';

// Mostra cada [data-reveal] uma vez quando entra na tela, ou quando a página
// pula por cima dele (link de âncora, rolagem rápida): nesse caso o
// IntersectionObserver não avisa, então a rolagem confere o que ficou para trás.
// Sem JavaScript a classe "js" não existe e tudo aparece normalmente.
export default function RevealObserver() {
    useEffect(() => {
        // Rede de segurança: o script do <head> põe "js" no <html>, mas se a hidratação
        // falhar o React redesenha a raiz e a classe some, levando junto todo o layout animado
        document.documentElement.classList.add('js');

        const pending = new Set(document.querySelectorAll('[data-reveal]'));
        const reveal = (el) => {
            el.classList.add('in');
            pending.delete(el);
            observer.unobserve(el);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) reveal(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px' });

        let frame = 0;
        const catchUp = () => {
            frame = 0;
            pending.forEach((el) => {
                if (el.getBoundingClientRect().top < window.innerHeight * 0.92) reveal(el);
            });
            if (!pending.size) window.removeEventListener('scroll', onScroll);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(catchUp);
        };

        pending.forEach((el) => observer.observe(el));
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(frame);
        };
    }, []);

    return null;
}
