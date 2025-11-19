import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ClientProviderWrapper } from "@/components/ClientProviderWrapper";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EmberAi MCP Explorer",
  description: "Model Context Protocol API Documentation & Testing Tool by EmberAi",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Force dark mode immediately
              document.documentElement.className = 'dark';
              document.documentElement.style.colorScheme = 'dark';
              // Override any theme detection
              if (window.matchMedia) {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
                mediaQuery.addEventListener('change', () => {
                  document.documentElement.className = 'dark';
                  document.documentElement.style.colorScheme = 'dark';
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${outfit.variable} antialiased dark`}
      >
        <ClientProviderWrapper>
          {children}
        </ClientProviderWrapper>
      </body>
    </html>
  );
}
