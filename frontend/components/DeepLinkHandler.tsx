"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

export default function DeepLinkHandler({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const startNativeListener = async () => {
        const { App } = await import('@capacitor/app');

        await App.addListener('appUrlOpen', (event: any) => {
            const path = event.url.split('://').pop();
            if (path) {
                router.push(`/${path}`);
            }
        });
    };

        startNativeListener();
    }, [router]);

    return <>{children}</>;
}