import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plotify",
  description:
    "A modern, interactive function plotter that uses regression analysis to estimate mathematical functions from hand-drawn curves.",
  applicationName: "Plotify",
  authors: [
    { name: "Magnus Rødseth", url: "https://github.com/magnusrodseth" },
  ],
  keywords: [
    "function plotter",
    "regression analysis",
    "mathematical functions",
    "curve fitting",
    "data visualization",
    "educational tool",
  ],
  creator: "Magnus Rødseth",
  publisher: "Magnus Rødseth",
  robots: "index, follow",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/icon.png",
      },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    url: "https://plotify.vercel.app",
    title: "Plotify",
    description:
      "A modern, interactive function plotter that uses regression analysis to estimate mathematical functions from hand-drawn curves.",
    siteName: "Plotify",
    images: [
      {
        url: "/icon.png",
        width: 32,
        height: 32,
        alt: "Plotify Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Plotify",
    description:
      "A modern, interactive function plotter that uses regression analysis to estimate mathematical functions from hand-drawn curves.",
    images: ["/icon.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
