function withMark(text, mark) {
    const at = text.indexOf(mark);
    if (at === -1) return text;
    return (
        <>
            {text.slice(0, at)}
            <mark>{mark}</mark>
            {text.slice(at + mark.length)}
        </>
    );
}

export default function About({ dict }) {
    return (
        <section id="about" className="letter" aria-labelledby="about-title">
            <h2 id="about-title" className="lead" data-reveal>{dict.title}</h2>
            {dict.paragraphs.map((p, i) => (
                <p key={i} data-reveal style={{ '--i': i + 1 }}>{withMark(p, dict.mark)}</p>
            ))}
            <div className="letter-sign" data-reveal style={{ '--i': 5 }}>
                <strong>Felipe Giacomini Cocco</strong>
                <span>{dict.role}</span>
            </div>
        </section>
    );
}
