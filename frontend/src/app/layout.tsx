import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { BottomNav } from "@/components/ui/BottomNav";
import { Providers } from "@/components/Providers";
import { SplashScreen } from "@/components/ui/SplashScreen";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Roomshare — Colocation Express à Reims",
  description:
    "Trouvez votre colocation idéale à Reims en moins de 24h. Étudiants, jeunes actifs : explorez les annonces, filtrez par budget et contactez directement.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Roomshare",
  },
  openGraph: {
    title: "Roomshare — Colocation Express à Reims",
    description: "Trouvez votre colocation idéale à Reims en moins de 24h.",
    type: "website",
    locale: "fr_FR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <SplashScreen />
          <main className="min-h-screen pb-20">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
