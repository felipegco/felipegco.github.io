/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: 'dist',
  basePath: "",
  reactCompiler: true,
  // Só para o `next dev`: libera abrir o servidor pelo IP da rede (ex.: no celular).
  // Sem isso o Next 16 recusa /_next/* e o hot reload vindo de outro host.
  allowedDevOrigins: ['192.168.*.*'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;