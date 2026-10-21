// GSAP, ScrollTrigger e Lenis carregados uma vez só para a página inteira.
// As cenas 3D pedem por aqui; quem chega primeiro cria, as outras reaproveitam.
let loading = null;

export function loadMotion() {
    if (loading) return loading;
    loading = Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('lenis')]).then(
        ([{ gsap }, { ScrollTrigger }, { default: Lenis }]) => {
            gsap.registerPlugin(ScrollTrigger);
            let lenis = null;
            // Rolagem com peso no mouse e no trackpad; o toque e o movimento reduzido ficam nativos
            const touch = window.matchMedia('(pointer: coarse)').matches;
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (!touch && !reduced) {
                lenis = new Lenis({ lerp: 0.12, smoothWheel: true, anchors: true, autoRaf: false });
                lenis.on('scroll', ScrollTrigger.update);
                gsap.ticker.add((t) => lenis.raf(t * 1000));
                gsap.ticker.lagSmoothing(0);
            }
            return { gsap, ScrollTrigger, lenis };
        },
    );
    return loading;
}
