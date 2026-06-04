import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hippo Support Control Center",
  description: "Internal support management platform for monitoring service quality, bugs, incidents, and knowledge base",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        {/* Apply theme before first paint — prevents white flash */}
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function() {
            try {
              var t = localStorage.getItem('theme');
              var theme = (t === 'light' || t === 'dark') ? t : 'dark';
              document.documentElement.setAttribute('data-theme', theme);
              document.documentElement.classList.add(theme);
            } catch(e) {
              document.documentElement.setAttribute('data-theme', 'dark');
              document.documentElement.classList.add('dark');
            }
          })();
        `}</Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
