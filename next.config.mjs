/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: 'dist',
  basePath: "",
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;