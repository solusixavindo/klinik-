import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaInstaller from "./components/PwaInstaller";

export const metadata: Metadata = {
  title: "XaviKlinika",
  description: "Platform manajemen klinik modern untuk praktek dan klinik",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "XaviKlinika",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        {children}
        <PwaInstaller />
      </body>
    </html>
  );
}
