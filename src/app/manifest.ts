import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'DMS - 42EV',
        short_name: 'DMS',
        description: 'Dealer Management System for 42EV',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
            {
                src: '/42ev.png',
                sizes: 'any',
                type: 'image/png',
            },
        ],
    }
}
