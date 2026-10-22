import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Tiro_Devanagari_Hindi,
   Anek_Devanagari,
  Mukta,
} from "next/font/google";
import "./globals.css";
import Second from "./components/second";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const anek = Anek_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-anek",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const heading = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-heading",
});

const body = Mukta({
  subsets: ["devanagari", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Chiya Pasal",
  description: "Yaar k garnu, Lamo jasto jindagi",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${anek.variable} ${geistMono.variable} ${heading.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}
      </body>
    </html>
  );
}