'use client';

import { useEffect } from 'react';

// Mostra cada [data-reveal] uma vez quando entra na tela.
// Sem JavaScript a classe "js" não existe e tudo aparece normalmente.
export default function RevealObserver() {
    useEffect(() => {
        const items = document.querySelectorAll('[data-reveal]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px' });

        items.forEach((item) => observer.observe(item));
        return () => observer.disconnect();
    }, []);

    return null;
}
