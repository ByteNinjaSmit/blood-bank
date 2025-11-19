import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/main-navbar";
import BackToTop from "@/components/utils/back-to-top-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sanjivani Blood Bank - Kopargaon | Safe & Reliable Blood Services",
  description: "Sai Seva Health Care Foudation's Sanjivani Blood Bank in Kopargaon is dedicated to providing safe, reliable blood services. Join us in saving lives through voluntary blood donation and exceptional care.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Epunda+Sans:ital,wght@0,300..900;1,300..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
      >
        <Navbar />
        {children}
        <BackToTop/>
      </body>
    </html>
  );
}
