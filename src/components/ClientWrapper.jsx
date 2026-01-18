'use client';

import { ThemeProvider } from '@/lib/ThemeContext';

export default function ClientWrapper({ children }) {
    return <ThemeProvider>{children}</ThemeProvider>;
}