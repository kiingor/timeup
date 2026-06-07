import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { ServiceWorkerRegister } from "@/components/pwa-install";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TimeUp — Acompanhamento de metas",
  description: "Acompanhamento visual e automático de metas de vendas.",
  manifest: "/manifest.webmanifest",
  applicationName: "TimeUp",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "TimeUp" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  // legacy iOS standalone flag (Next emits the modern `mobile-web-app-capable` only)
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#6d5dd3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={jakarta.variable} suppressHydrationWarning>
      <body>
        {children}
        <Toaster richColors closeButton position="top-right" />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
