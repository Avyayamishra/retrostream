import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3, Courier_Prime } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthProvider";
import { PlayerProvider } from "@/context/PlayerProvider";
import { Header } from "@/components/Header";
import { BottomPlayer } from "@/components/BottomPlayer";

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair"
});
const sourceSans = Source_Sans_3({
    subsets: ["latin"],
    variable: "--font-source"
});
const courier = Courier_Prime({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-courier"
});

export const metadata: Metadata = {
    title: "RetroStream",
    description: "Classic vibes, modern streaming.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${playfair.variable} ${sourceSans.variable} ${courier.variable}`}>
                <AuthProvider>
                    <PlayerProvider>
                        <div className="min-h-screen flex flex-col">
                            <Header />

                            <main className="flex-1 pt-24 pb-28 px-8 w-full max-w-[1800px] mx-auto">
                                {children}
                            </main>

                            <BottomPlayer />
                        </div>
                    </PlayerProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
