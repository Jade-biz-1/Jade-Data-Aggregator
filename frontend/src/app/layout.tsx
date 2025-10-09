import type { Metadata } from "next";
import "./globals.css";
import { SkipLink } from "@/components/ui/SkipLink";

export const metadata: Metadata = {
  title: "Data Aggregator Platform",
  description: "A comprehensive data integration solution designed to connect, process, and deliver data from multiple sources in a standardized format.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <SkipLink href="#navigation">Skip to navigation</SkipLink>
        {children}
      </body>
    </html>
  );
}
