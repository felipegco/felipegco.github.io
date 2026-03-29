"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
    const router = useRouter();

    useEffect(() => {
        const userLang = navigator.language || navigator.userLanguage || '';

        if (userLang.toLowerCase().startsWith('pt')) {
            router.replace('/pt');
        } else {
            router.replace('/en');
        }
    }, [router]);

    return null;
}