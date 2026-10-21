// GSAP, ScrollTrigger e Lenis carregados uma vez só para a página inteira.
// As cenas 3D pedem por aqui; quem chega primeiro cria, as outras reaproveitam.
let loading = null;

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export function loadMotion() {
    if (loading) return loading;
    loading = Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('lenis')]).then(
        ([{ gsap }, { ScrollTrigger }, { default: Lenis }]) => {
            gsap.registerPlugin(ScrollTrigger);

            // auto fica ligado enquanto a página anda sozinha (link, ímã de uma cena),
            // para as cenas não prenderem o usuário no meio desse caminho
            const state = { auto: false };
            let lenis = null;

            // Freios das cenas: cada uma devolve quanto da rolada deixa passar (0 a 1)
            const dampers = new Set();
            const addDamper = (fn) => {
                dampers.add(fn);
                return () => dampers.delete(fn);
            };

            // Rolagem com peso no mouse e no trackpad; o toque e o movimento reduzido ficam nativos
            const touch = window.matchMedia('(pointer: coarse)').matches;
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (!touch && !reduced) {
                lenis = new Lenis({
                    lerp: 0.1,
                    wheelMultiplier: 0.9,
                    smoothWheel: true,
                    autoRaf: false,
                    // Toda rolada do usuário passa por aqui: ela tira a página de um deslize
                    // automático e encolhe perto das paradas das cenas
                    virtualScroll: (data) => {
                        state.auto = false;
                        let factor = 1;
                        dampers.forEach((fn) => { factor = Math.min(factor, fn(data.deltaY)); });
                        data.deltaY *= factor;
                        return true;
                    },
                });
                lenis.on('scroll', ScrollTrigger.update);
                gsap.ticker.add((t) => lenis.raf(t * 1000));
                gsap.ticker.lagSmoothing(0);
            }

            const glideTo = (top, { duration = 1.2, lock = false, onComplete } = {}) => {
                if (!lenis) {
                    window.scrollTo({ top, behavior: 'smooth' });
                    onComplete?.();
                    return;
                }
                state.auto = true;
                lenis.scrollTo(top, {
                    duration,
                    lock,
                    force: true,
                    easing: easeOut,
                    onComplete: () => {
                        state.auto = false;
                        onComplete?.();
                    },
                });
            };

            // Links de âncora deslizam até o destino sem parar nas cenas do caminho
            if (lenis) {
                document.addEventListener('click', (e) => {
                    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
                    const link = e.target.closest?.('a[href^="#"]');
                    const el = link && document.getElementById(link.getAttribute('href').slice(1));
                    if (!el) return;
                    e.preventDefault();
                    glideTo(el.getBoundingClientRect().top + window.scrollY, { duration: 1.6 });
                });
            }

            return { gsap, ScrollTrigger, lenis, state, glideTo, addDamper };
        },
    );
    return loading;
}
