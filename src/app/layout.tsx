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
    "MailOqui est la plateforme SaaS de gestion et d'automatisation des e-mails. Créez des campagnes, gérez vos contacts, programmez vos envois et suivez vos performances.",
  keywords: [
    "MailOqui",
    "email marketing",
    "campagnes email",
    "automatisation email",
    "newsletter",
    "gestion des campagnes",
    "SaaS email",
  ],
  authors: [{ name: "MailOqui" }],
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
