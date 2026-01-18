'use client';

import { useTheme } from '@/lib/ThemeContext';

export default function CodeProfile({dict}) {
    const { theme } = useTheme();

    return (
        <div className="font-mono text-sm leading-relaxed">
            <div className="mb-4 flex items-center text-lg font-bold text-text-primary">
                <i className="fa-solid fa-terminal mr-3 text-blue-500"></i>
                developer_profile.json
            </div>

            <div
                className="rounded-lg border p-6 transition-colors duration-300"
                style={{
                    borderColor: 'var(--card-border)',
                    backgroundColor: theme === 'dark' ? '#000000' : '#f8f8f8',
                    color: theme === 'dark' ? '#93c5fd' : '#2563eb'
                }}
            >
        <pre className="whitespace-pre-wrap wrap-break-word">
          {`{
  `}
            <span style={{ color: theme === 'dark' ? '#f87171' : '#dc2626' }}>"{dict.profileJson.name}"</span>: <span style={{ color: theme === 'dark' ? '#93c5fd' : '#2563eb' }}>"Felipe Giacomini Cocco"</span>,
            {`
  `}
            <span style={{ color: theme === 'dark' ? '#f87171' : '#dc2626' }}>"{dict.profileJson.degreeTitle}"</span>: <span style={{ color: theme === 'dark' ? '#93c5fd' : '#2563eb' }}>"Sistemas de Informação - FHO"</span>,
            {`
  `}
            <span style={{ color: theme === 'dark' ? '#f87171' : '#dc2626' }}>"{dict.profileJson.goal}"</span>: <span style={{ color: theme === 'dark' ? '#93c5fd' : '#2563eb' }}>"Full Stack Development"</span>,
            {`
  `}
            <span style={{ color: theme === 'dark' ? '#f87171' : '#dc2626' }}>"local"</span>: <span style={{ color: theme === 'dark' ? '#93c5fd' : '#2563eb' }}>"{dict.profileJson.place}"</span>,
            {`
  `}
            <span style={{ color: theme === 'dark' ? '#f87171' : '#dc2626' }}>"bio"</span>: <span style={{ color: theme === 'dark' ? '#93c5fd' : '#2563eb' }}>"{dict.profileJson.bio}"</span>
            {`
}`}
        </pre>
            </div>
        </div>
    );
}