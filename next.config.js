/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [
            'firebasestorage.googleapis.com',
            'via.placeholder.com',
            'drive.google.com',
            'i.imgur.com',
            'images.unsplash.com',
            'lh3.googleusercontent.com'
        ],
    },
    experimental: {
        serverComponentsExternalPackages: ['firebase-admin', 'undici'],
    },
};

module.exports = nextConfig;
