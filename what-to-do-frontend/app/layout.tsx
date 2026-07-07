import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import MainNav from "./components/MainNav";
import Providers from "./components/Providers";
import type { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "What To Do",
  description: "AI-powered activity planning and itinerary generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <Providers>
          <MainNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
