import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Expertum",
  description:
    "Nominate who is better than you in a discipline, and watch knowledge centers emerge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
