export default function Footer({ dict }) {
    return (
        <footer className="footer">
            <div className="footer-top">
                <ul>
                    <li><a href="#about">{dict.about}</a></li>
                    <li><a href="#projects">{dict.projects}</a></li>
                    <li><a href="#journey">{dict.journey}</a></li>
                    <li><a href="#contact">{dict.contact}</a></li>
                </ul>
                <p className="footer-status">{dict.status}</p>
                <ul>
                    <li><a href="mailto:fgiacominicocco@gmail.com">fgiacominicocco@gmail.com</a></li>
                    <li><a href="https://www.linkedin.com/in/felipegcocco/" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
                    <li><a href="https://github.com/felipegco" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                </ul>
            </div>

            <div className="footer-name">
                <p>Felipe Cocco</p>
                <small>
                    &copy; {new Date().getFullYear()} <a href="https://github.com/felipegco/felipegco.github.io" target="_blank" rel="noopener noreferrer">{dict.rights}</a>
                </small>
            </div>
        </footer>
    );
}
