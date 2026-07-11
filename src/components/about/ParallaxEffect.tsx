
'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import Lenis from "lenis";
import { ZoomParallax } from '@/components/ui/zoom-parallax';

export default function DefaultDemo() {

    React.useEffect( () => {
        const lenis = new Lenis()
       
        function raf(time: number) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }

        requestAnimationFrame(raf)
    },[])

    const images = [
        {
            src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
            alt: 'Modern architecture building',
            content: (
                <div className="absolute inset-0 flex flex-col justify-end p-6 bg-linear-to-t from-black/80 via-black/20 to-transparent text-white">
                    <h3 className="text-2xl font-bold tracking-tight">$12,500,000</h3>
                    <p className="text-sm opacity-90 mb-4">Downtown Commercial Metroplex</p>
                    <button className="w-fit px-6 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-gray-200 transition-colors">
                        View Property
                    </button>
                </div>
            )
        },
        {
            src: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
            alt: 'Urban cityscape at sunset',
            content: (
                <div className="absolute inset-0 flex flex-col justify-end p-6 bg-linear-to-t from-black/80 via-black/20 to-transparent text-white">
                    <h3 className="text-2xl font-bold tracking-tight">$4,250,000</h3>
                    <p className="text-sm opacity-90 mb-4">Skyline Penthouse Suite</p>
                    <button className="w-fit px-6 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-gray-200 transition-colors">
                        View Property
                    </button>
                </div>
            )
        },
        {
            src: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
            alt: 'Abstract geometric pattern',
            content: (
                <div className="absolute inset-0 flex flex-col justify-end p-6 bg-linear-to-t from-black/80 via-black/20 to-transparent text-white">
                    <h3 className="text-2xl font-bold tracking-tight">$8,900,000</h3>
                    <p className="text-sm opacity-90 mb-4">Modern Art Deco Villa</p>
                    <button className="w-fit px-6 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-gray-200 transition-colors">
                        View Property
                    </button>
                </div>
            )
        },
        {
            src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
            alt: 'Mountain landscape',
            content: (
                <div className="absolute inset-0 flex flex-col justify-end p-6 bg-linear-to-t from-black/80 via-black/20 to-transparent text-white">
                    <h3 className="text-2xl font-bold tracking-tight">$1,850,000</h3>
                    <p className="text-sm opacity-90 mb-4">Secluded Mountain Retreat</p>
                    <button className="w-fit px-6 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-gray-200 transition-colors">
                        View Property
                    </button>
                </div>
            )
        },
        {
            src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
            alt: 'Minimalist design elements',
            content: (
                <div className="absolute inset-0 flex flex-col justify-end p-6 bg-linear-to-t from-black/80 via-black/20 to-transparent text-white">
                    <h3 className="text-2xl font-bold tracking-tight">$3,100,000</h3>
                    <p className="text-sm opacity-90 mb-4">Minimalist Smart Home</p>
                    <button className="w-fit px-6 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-gray-200 transition-colors">
                        View Property
                    </button>
                </div>
            )
        },
        {
            src: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
            alt: 'Ocean waves and beach',
            content: (
                <div className="absolute inset-0 flex flex-col justify-end p-6 bg-linear-to-t from-black/80 via-black/20 to-transparent text-white">
                    <h3 className="text-2xl font-bold tracking-tight">$14,000,000</h3>
                    <p className="text-sm opacity-90 mb-4">Private Beachfront Estate</p>
                    <button className="w-fit px-6 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-gray-200 transition-colors">
                        View Property
                    </button>
                </div>
            )
        },
        {
            src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
            alt: 'Forest trees and sunlight',
            content: (
                <div className="absolute inset-0 flex flex-col justify-end p-6 bg-linear-to-t from-black/80 via-black/20 to-transparent text-white">
                    <h3 className="text-2xl font-bold tracking-tight">$2,250,000</h3>
                    <p className="text-sm opacity-90 mb-4">Woodland Modern Cabin</p>
                    <button className="w-fit px-6 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-gray-200 transition-colors">
                        View Property
                    </button>
                </div>
            )
        },
    ];

    return (
        <main className="min-h-screen w-full">
            <div className="relative flex h-[20vh] items-center justify-center">
                {/* Radial spotlight */}
                <div
                    aria-hidden="true"
                    className={cn(
                        'pointer-events-none absolute -top-1/2 left-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 rounded-full',
                        'bg-[radial-gradient(ellipse_at_center,--theme(--color-foreground/.1),transparent_50%)]',
                        'blur-[30px]',
                    )}
                />
            </div>
            <ZoomParallax images={images} />
            <div className="h-[50vh]"/>
        </main>
    );
}

