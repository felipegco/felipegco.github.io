export default function Footer() {
    return (
        <footer className="border-t border-border bg-background py-12 mt-20">
            <div className="max-w-275 mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">

                <div className="flex flex-col items-center md:items-start">
                    <span className="text-xl font-extrabold tracking-tighter text-text-primary">
                        Felipe<span className="text-blue-500">.dev</span>
                    </span>
                    <p className="text-sm text-text-secondary mt-2 font-mono">
                        &copy; {new Date().getFullYear()} Felipe Giacomini Cocco.
                    </p>
                </div>

                <div className="flex gap-6 text-text-secondary">
                    <a href="https://github.com/FeCocco" target="_blank" className="hover:text-blue-500 transition-colors text-xl">
                        <i className="fa-brands fa-github"></i>
                    </a>
                    <a href="https://www.linkedin.com/in/felipegcocco/" target="_blank" className="hover:text-blue-500 transition-colors text-xl">
                        <i className="fa-brands fa-linkedin"></i>
                    </a>
                    <a href="mailto:fgiacominicocco@gmail.com" className="hover:text-blue-500 transition-colors text-xl">
                        <i className="fa-solid fa-envelope"></i>
                    </a>
                </div>
            </div>
        </footer>
    );
}