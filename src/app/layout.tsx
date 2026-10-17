import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  title: "MR A Studio — Premium Barbershop & Grooming",
  description:
    "Temukan gaya terbaikmu bersama MR A Studio. Layanan potong rambut presisi dan sistem booking online.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} ${syne.variable} scroll-smooth`}>
      <body className="bg-brand-cream text-brand-charcoal font-sans antialiased selection:bg-brand-peach selection:text-brand-charcoal">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}