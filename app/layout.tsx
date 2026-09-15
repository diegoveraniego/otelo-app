import type { Metadata, Viewport } from "next";
import { Chelsea_Market, Patrick_Hand } from "next/font/google";
import "./globals.css";
import UserSelectModal, { OpenUserModalButton } from "@/components/UserSelectModal";
import BottomNav from "@/components/BottomNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotificationBell from "@/components/NotificationBell";
import AchievementToast from "@/components/AchievementToast";
import Image from "next/image";

const chelseaMarket = Chelsea_Market({ weight: "400", subsets: ["latin"], variable: "--font-chelsea" });
const patrickHand = Patrick_Hand({ weight: "400", subsets: ["latin"], variable: "--font-sketch" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 0.8,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Otelo - Family Chores",
  description: "App para registrar tareas del hogar",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo_otelo.png",
    apple: "/logo_otelo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${chelseaMarket.variable} w-screen overflow-x-hidden`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        suppressHydrationWarning
        className={`${patrickHand.className} sketchy-bg text-[#2D2D2D] pb-[4rem] min-h-screen`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
          <header
            className="sticky top-0 z-40 bg-[#fcf9e3]/90 backdrop-blur-md border-b-2 border-[#2d2d2d] px-2 py-1 md:px-4 md:py-3 flex justify-between items-center w-screen"
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
                style={{ fontFamily: "var(--font-chelsea)" }}
              >
                Otelo
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <OpenUserModalButton />
            </div>
          </header>

          <main className="w-full px-2 py-2 md:px-6 md:py-4 text-sm">
            {children}
          </main>

          <UserSelectModal />
          <AchievementToast />
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
