/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: 'dist',
  basePath: "/portifolio-v2",
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;