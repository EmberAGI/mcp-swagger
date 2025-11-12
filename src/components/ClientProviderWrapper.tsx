'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const ProviderWrapper = dynamic(
  () => import('@/components/ProviderWrapper').then((mod) => ({ default: mod.ProviderWrapper })),
  { ssr: false }
);

export function ClientProviderWrapper({ children }: { children: ReactNode }) {
  return <ProviderWrapper>{children}</ProviderWrapper>;
}

