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
  title: "MailOqui — Automatisez votre marketing par e-mail",
  description:
    "MailOqui est la plateforme africaine de gestion et d'automatisation des e-mails. Siège au Nigeria, agences au Bénin, Togo et Ghana. Créez des campagnes, gérez vos contacts, programmez vos envois et suivez vos performances.",
  keywords: [
    "MailOqui",
    "email marketing",
    "campagnes email",
    "automatisation email",
    "newsletter",
    "gestion des campagnes",
    "SaaS email",
    "Nigeria",
    "Togo",
    "Bénin",
    "Ghana",
    "Afrique de l'Ouest",
  ],
  authors: [{ name: "MailOqui" }],
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
    title: "MailOqui — Automatisez votre marketing par e-mail",
    description:
      "Développez votre communication, programmez vos campagnes et suivez vos performances depuis une plateforme conçue pour votre activité.",
    url: "https://mail.oquitogo.com",
    siteName: "MailOqui",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MailOqui — Automatisez votre marketing par e-mail",
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
