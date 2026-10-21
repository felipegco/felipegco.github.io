// GSAP, ScrollTrigger e Lenis carregados uma vez só para a página inteira.
// As cenas 3D pedem por aqui; quem chega primeiro cria, as outras reaproveitam.
let loading = null;

// Arranca na hora (o gesto já tem resposta) e freia devagar até o card
const easeOut = (t) => 1 - Math.pow(1 - t, 4);

// Quanto o gesto precisa andar para virar a página (roda/trackpad e toque)
const WHEEL_STEP = 24;
const SWIPE_STEP = 40;
// Pausa que separa um gesto do outro: a inércia do trackpad não vira duas páginas
const QUIET = 200;
// Seção mais alta que a tela anda neste pedaço da tela por vez, sem pular nada
const PAGE = 0.85;
const MERGE = 48;

const isField = (el) => !!el?.closest?.('input, select, textarea, [contenteditable="true"], [data-lenis-prevent]');

export function loadMotion() {
    if (loading) return loading;
    loading = Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('lenis')]).then(
        ([{ gsap }, { ScrollTrigger }, { default: Lenis }]) => {
            gsap.registerPlugin(ScrollTrigger);

            let lenis = null;
            let busy = false;

            // Paradas da página: as cenas registram as delas; as outras seções marcam [data-slide]
            const providers = new Set();
            const addStops = (fn) => {
                providers.add(fn);
                return () => providers.delete(fn);
            };

            const stops = () => {
                const limit = lenis.limit;
                const list = [0, limit];
                providers.forEach((fn) => list.push(...fn()));
                document.querySelectorAll('[data-slide]').forEach((el) => {
                    list.push(el.getBoundingClientRect().top + window.scrollY);
                });
                // Paradas a menos de MERGE uma da outra viram a de baixo: nada de passos de poucos pixels
                return list
                    .map((y) => Math.min(Math.max(Math.round(y), 0), limit))
                    .sort((a, b) => a - b)
                    .filter((y, i, all) => i === all.length - 1 || all[i + 1] - y > MERGE);
            };

            const glideTo = (top, { duration = 1.6, onComplete } = {}) => {
                if (!lenis) {
                    window.scrollTo({ top, behavior: 'smooth' });
                    onComplete?.();
                    return;
                }
                busy = true;
                lenis.scrollTo(top, {
                    duration,
                    lock: true,
                    force: true,
                    easing: easeOut,
                    onComplete: () => {
                        busy = false;
                        onComplete?.();
                    },
                });
            };

            // Um card por vez: vai até a próxima parada; se ela estiver a mais de uma tela,
            // divide o caminho em pedaços iguais para o texto do meio passar pela tela
            const step = (dir) => {
                if (busy) return;
                const y = lenis.targetScroll;
                const vh = window.innerHeight;
                const list = stops();
                const next = dir > 0 ? list.find((s) => s > y + 4) : list.findLast((s) => s < y - 4);
                if (next === undefined) return;
                const dist = Math.abs(next - y);
                const parts = dist <= vh * 1.05 ? 1 : Math.ceil(dist / (vh * PAGE));
                const move = dist / parts;
                glideTo(y + dir * move, { duration: Math.min(1.3 + (move / vh) * 0.4, 2) });
            };

            // Rolagem em slides no mouse, no trackpad e no toque; o movimento reduzido fica nativo
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (!reduced) {
                let armed = true;
                let acc = 0;
                let lastWheel = 0;
                let touch = null;

                lenis = new Lenis({
                    lerp: 0.06,
                    smoothWheel: true,
                    autoRaf: false,
                    // Toda rolada do usuário passa por aqui e vira, no máximo, uma página por gesto
                    virtualScroll: ({ deltaX, deltaY, event }) => {
                        if (event.ctrlKey) return true;

                        if (event.type === 'wheel') {
                            if (Math.abs(deltaX) > Math.abs(deltaY)) return true;
                            // Caixas com rolagem própria (a resposta do console) rolam por dentro
                            if (event.target.closest?.('[data-lenis-prevent]')) return true;
                            if (event.cancelable) event.preventDefault();
                            const now = performance.now();
                            if (now - lastWheel > QUIET) { armed = true; acc = 0; }
                            lastWheel = now;
                            if (busy || !armed) return false;
                            acc += deltaY;
                            if (Math.abs(acc) >= WHEEL_STEP) {
                                armed = false;
                                step(Math.sign(acc));
                            }
                            return false;
                        }

                        // Toque: o arrasto não rola a página; ao soltar, um swipe vira um card
                        const point = event.touches?.[0] ?? event.changedTouches?.[0];
                        if (event.type === 'touchstart') {
                            touch = event.touches.length > 1 || isField(event.target) ? null : { x: point.clientX, y: point.clientY };
                            return false;
                        }
                        if (!touch) return true;
                        const dx = point.clientX - touch.x;
                        const dy = point.clientY - touch.y;
                        if (event.type === 'touchmove') {
                            if (event.touches.length > 1) { touch = null; return true; }
                            if (Math.abs(dy) > Math.abs(dx) && event.cancelable) event.preventDefault();
                            return false;
                        }
                        touch = null;
                        if (Math.abs(dy) > SWIPE_STEP && Math.abs(dy) > Math.abs(dx)) step(dy < 0 ? 1 : -1);
                        return false;
                    },
                });
                lenis.on('scroll', ScrollTrigger.update);
                gsap.ticker.add((t) => lenis.raf(t * 1000));
                gsap.ticker.lagSmoothing(0);

                // Teclado: setas, Page Up/Down e espaço também andam um card
                const KEYS = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 };
                window.addEventListener('keydown', (e) => {
                    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isField(e.target)) return;
                    let dir = KEYS[e.key];
                    if (!dir) return;
                    if (e.key === ' ' && e.target.closest?.('button, a')) return;
                    if (e.key === ' ' && e.shiftKey) dir = -1;
                    e.preventDefault();
                    step(dir);
                });

                // Links de âncora deslizam até o destino sem parar nas cenas do caminho
                document.addEventListener('click', (e) => {
                    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
                    const link = e.target.closest?.('a[href^="#"]');
                    const el = link && document.getElementById(link.getAttribute('href').slice(1));
                    if (!el) return;
                    e.preventDefault();
                    glideTo(el.getBoundingClientRect().top + window.scrollY, { duration: 2 });
                });
            }

            // Chegando por um link com âncora (/pt#projects), o navegador pula antes de a cena
            // ganhar a altura dela e ainda reaplica a âncora até a página terminar de carregar.
            // Quando a cena fica pronta, refaz o pulo agora e mais uma vez depois do load.
            let hashDone = false;
            const followHash = () => {
                if (hashDone || !window.location.hash) return;
                hashDone = true;
                const el = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
                if (!el) return;
                const jump = () => {
                    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
                    lenis?.resize();
                };
                jump();
                const start = window.scrollY;
                const later = () => requestAnimationFrame(() => {
                    // só corrige se ninguém rolou desde o pulo
                    if (Math.abs(window.scrollY - start) < 80) jump();
                });
                if (document.readyState === 'complete') later();
                else window.addEventListener('load', later, { once: true });
            };

            return { gsap, ScrollTrigger, lenis, glideTo, addStops, followHash };
        },
    );
    return loading;
}
