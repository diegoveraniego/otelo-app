import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import UserSelectModal, { OpenUserModalButton } from "@/components/UserSelectModal";
import BottomNav from "@/components/BottomNav";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });
const bagnard = localFont({ src: "../public/fonts/Bagnard.otf", variable: "--font-bagnard" });

export const metadata: Metadata = {
  title: "Otelo - Family Chores",
  description: "App para registrar tareas del hogar",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={bagnard.variable}>
      <body className={`${inter.className} bg-[#FAFAFA] dark:bg-[#242424] text-[#1E1E1E] dark:text-white pb-20 md:pb-0 min-h-screen transition-colors`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="sticky top-0 z-40 bg-white dark:bg-[#303030] border-b border-[#E5E6E6] dark:border-[#3D3D3D] p-4 flex justify-between items-center max-w-7xl mx-auto w-full transition-colors">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl text-[#1E1E1E] dark:text-white" style={{ fontFamily: "var(--font-bagnard)" }}>
                Otelo
              </h1>
            </div>
            <OpenUserModalButton />
          </header>
          
          <main className="max-w-7xl mx-auto w-full p-4">
            {children}
          </main>

          <UserSelectModal />
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
