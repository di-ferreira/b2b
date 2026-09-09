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
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                ],
            },
        ];
    },
});

export default nextConfig;
