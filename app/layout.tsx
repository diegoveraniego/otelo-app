import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import UserSelectModal, { OpenUserModalButton } from "@/components/UserSelectModal";
import BottomNav from "@/components/BottomNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotificationBell from "@/components/NotificationBell";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });
const bagnard = localFont({ src: "../public/fonts/Bagnard.otf", variable: "--font-bagnard" });

export const metadata: Metadata = {
  title: "Otelo - Family Chores",
  description: "App para registrar tareas del hogar",
  manifest: "/manifest.json",
  viewport: "width=device-width, initial-scale=0.8, viewport-fit=cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${bagnard.variable} w-screen overflow-x-hidden`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${inter.className} bg-[#FAFAFA] dark:bg-[#242424] text-[#1E1E1E] dark:text-white pb-[4rem] min-h-screen transition-colors`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header
            className="sticky top-0 z-40 bg-white dark:bg-[#303030] border-b border-[#E5E6E6] dark:border-[#3D3D3D] px-2 py-1 md:px-4 md:py-3 flex justify-between items-center w-screen"
          >
            <div className="flex items-center gap-2">
              <Image
                src="/logo_otelo.png"
                alt="Logo Otelo"
                width={32}
                height={32}
                className="w-5 h-5 md:w-8 md:h-8 dark:invert"
                priority
                unoptimized={true}
              />
              <h1
                className="text-lg md:text-3xl text-[#1E1E1E] dark:text-white"
                style={{ fontFamily: "var(--font-bagnard)" }}
              >
                Otelo
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <OpenUserModalButton />
            </div>
          </header>

          <main className="w-full px-2 py-2 md:p-4 max-w-[1024px] mx-auto text-sm">
            {children}
          </main>

          <UserSelectModal />
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
