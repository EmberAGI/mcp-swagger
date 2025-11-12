'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { darkTheme, getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { cookieStorage, cookieToInitialState, createStorage, WagmiProvider } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import React, { useMemo, useEffect, useState } from 'react';

export function ProviderWrapper({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const config = useMemo(
        () => {
            if (typeof window === 'undefined') return null;
            return getDefaultConfig({
                appName: 'EmberAi MCP Explorer',
                projectId: '4b49e5e63b9f6253943b470873b47208', // You should replace this with your own project ID from WalletConnect
                chains: [arbitrum, mainnet, polygon, optimism, base],
                ssr: false, // Disable SSR since we're loading this client-side only
                storage: createStorage({ storage: cookieStorage }),
            });
        },
        []
    );

    const queryClient = useMemo(() => new QueryClient(), []);
    
    const cookie = typeof window !== 'undefined' ? (cookieStorage.getItem('wagmi.storage') || '') : '';
    const initialState = config ? cookieToInitialState(config, cookie) : undefined;

    // Don't render providers until mounted (client-side only)
    if (!mounted || !config) {
        return <>{children}</>;
    }

    return (
        <>
            <WagmiProvider config={config} reconnectOnMount={true} initialState={initialState}>
                <QueryClientProvider client={queryClient}>
                    <RainbowKitProvider
                        theme={darkTheme({
                            accentColor: "#FD6731", // EmberAi orange color
                            accentColorForeground: "#fff",
                        })}
                        initialChain={arbitrum}
                    >
                        {children}
                    </RainbowKitProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </>
    );
}
