import withBundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true', // Ativa análise somente quando ANALYZE=true
})({
    output: 'standalone', // Mantém a configuração de standalone
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb', // Limite de tamanho do corpo da requisição
        }
    }
});

export default nextConfig;
