'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const EMAIL = 'fgiacominicocco@gmail.com';

export default function Contact({ dict }) {
    const [message, setMessage] = useState('');

    const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(dict.subject)}&body=${encodeURIComponent(message)}`;

    const handleSubmit = (e) => {
        e.preventDefault();
        window.location.href = mailto;
    };

    return (
        <section id="contact" className="contact" data-slide aria-labelledby="contact-title">
            <h2 id="contact-title" className="lead" data-reveal>
                <span>{dict.line1}</span>
                <span>{dict.line2}</span>
            </h2>

            <form action={`mailto:${EMAIL}`} method="post" encType="text/plain" onSubmit={handleSubmit} data-reveal style={{ '--i': 1 }}>
                <label className="visually-hidden" htmlFor="contact-message">{dict.placeholder}</label>
                <input
                    id="contact-message"
                    name="mensagem"
                    type="text"
                    placeholder={dict.placeholder}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    autoComplete="off"
                />
                <button type="submit" className="button send" aria-label={dict.submit}>
                    <ArrowRight size={20} aria-hidden="true" />
                </button>
            </form>
            <p className="contact-after" data-reveal style={{ '--i': 2 }}>{dict.after}</p>

            <dl data-reveal style={{ '--i': 3 }}>
                <dt>{dict.email}</dt>
                <dd><a href={`mailto:${EMAIL}`}>{EMAIL}</a></dd>
                <dt>{dict.linkedin}</dt>
                <dd><a href="https://www.linkedin.com/in/felipegcocco/" target="_blank" rel="noopener noreferrer">linkedin.com/in/felipegcocco</a></dd>
                <dt>{dict.github}</dt>
                <dd><a href="https://github.com/felipegco" target="_blank" rel="noopener noreferrer">github.com/felipegco</a></dd>
                <dt>{dict.resume}</dt>
                <dd><a href="/resume.pdf" download>{dict.resumeLink}</a></dd>
            </dl>
        </section>
    );
}
