'use client';

import { useTheme } from '@/lib/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card hover:bg-card-hover transition-all duration-300 text-text-secondary hover:text-text-primary group"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <Sun
                    size={18}
                    className="transition-transform group-hover:rotate-45 group-hover:scale-110"
                />
            ) : (
                <Moon
                    size={18}
                    className="transition-transform group-hover:-rotate-12 group-hover:scale-110"
                />
            )}
        </button>
    );
}