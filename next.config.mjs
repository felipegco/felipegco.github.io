/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: 'dist',
  reactCompiler: true,
  async redirects() { return [
    {
      source: '/',
      destination: '/en',
      permanent: true
    }
  ] }
};
export default nextConfig;