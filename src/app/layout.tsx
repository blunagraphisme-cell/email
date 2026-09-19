import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EmailOqui — Reporting & gestion d'abonnement e-mail",
  description:
    "EmailOqui est la couche africaine de reporting et de gestion d'abonnement pour vos communications e-mail. Votre application envoie, EmailOqui agrège les statistiques et les présente au propriétaire. Siège au Nigeria, agences au Bénin, Togo et Ghana.",
  keywords: [
    "EmailOqui",
    "reporting e-mail",
    "statistiques e-mail",
    "gestion d'abonnement",
    "API ingestion événements",
    "tableau de bord e-mail",
    "SaaS email",
    "Nigeria",
    "Togo",
    "Bénin",
    "Ghana",
    "Afrique de l'Ouest",
  ],
  authors: [{ name: "EmailOqui" }],
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    title: "EmailOqui — Automatisez votre marketing par e-mail",
    description:
      "Développez votre communication, programmez vos campagnes et suivez vos performances depuis une plateforme conçue pour votre activité.",
    url: "https://email.oquitogo.online",
    siteName: "EmailOqui",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EmailOqui — Automatisez votre marketing par e-mail",
    description:
      "Développez votre communication, programmez vos campagnes et suivez vos performances.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <Sonner />
      </body>
    </html>
  );
}
