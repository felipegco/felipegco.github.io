'use client';

import { useTheme } from '@/lib/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ labels }) {
    const { theme, toggleTheme } = useTheme();
    const label = theme === 'dark' ? labels.themeLight : labels.themeDark;

    return (
        <button type="button" onClick={toggleTheme} className="tool" aria-label={label} title={label}>
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>
    );
}
