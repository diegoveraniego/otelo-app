import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import UserSelectModal, { OpenUserModalButton } from "@/components/UserSelectModal";
import BottomNav from "@/components/BottomNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotificationBell from "@/components/NotificationBell";

const inter = Inter({ subsets: ["latin"] });
const bagnard = localFont({ src: "../public/fonts/Bagnard.otf", variable: "--font-bagnard" });

export const metadata: Metadata = {
  title: "Otelo - Family Chores",
  description: "App para registrar tareas del hogar",
  manifest: "/manifest.json",
  viewport: "width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={bagnard.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} bg-[#FAFAFA] dark:bg-[#242424] text-[#1E1E1E] dark:text-white pb-20 md:pb-0 min-h-screen transition-colors overflow-x-hidden w-screen`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="sticky top-0 z-40 bg-white dark:bg-[#303030] border-b border-[#E5E6E6] dark:border-[#3D3D3D] px-4 py-3 flex justify-between items-center w-screen transition-colors">
            <div className="flex items-center gap-2">
              <img
                src="/logo_otelo.png"
                alt="Logo Otelo"
                className="w-8 h-8 dark:invert"
              />
              <h1 className="text-3xl text-[#1E1E1E] dark:text-white" style={{ fontFamily: "var(--font-bagnard)" }}>
                Otelo
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <OpenUserModalButton />
            </div>
          </header>
          
          <main className="max-w-7xl mx-auto w-full px-3 py-4 md:p-4">
            {children}
          </main>

          <UserSelectModal />
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
