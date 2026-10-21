'use client';

import { useEffect, useState } from 'react';

// "Hoje" sem quebrar a hidratação. O HTML é gerado no build, então o primeiro render
// usa a data do build (builtAt, vinda do servidor como prop: a mesma no HTML e no navegador)
// e, depois de montar, troca para a data real. Quem usa calcula sempre em UTC, para o build
// (que roda em UTC) e o navegador (no fuso do visitante) chegarem ao mesmo número.
export function useToday(builtAt) {
    const [today, setToday] = useState(() => new Date(builtAt));
    useEffect(() => {
        setToday(new Date());
    }, []);
    return today;
}
