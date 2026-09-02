import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NoBS Computers — Custom Desktop Builds",
  description: "Honest custom PC builds matched to your needs and budget.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-white text-neutral-900">
        {children}
      </body>
    </html>
  );
}
